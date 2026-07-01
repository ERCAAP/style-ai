// Minimal Analysis Function
// Firebase Secret'ten OpenAI key kullanarak hızlı analiz

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';

// Firestore database
const db = admin.firestore();

// OpenAI API key secret
const openaiApiKey = defineSecret('OPENAI_API_KEY');

// OpenAI client singleton
let openaiClient: OpenAI | null = null;

function getOpenAIClient(apiKey: string): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// User verification (auto-create if not exists)
async function verifyUser(uid: string): Promise<{
  isValid: boolean;
  isBlocked: boolean;
  isPremium: boolean;
  remainingJobs: number;
  analysisToday: number;
}> {
  const userRef = db.collection('users').doc(uid);
  const userDoc = await userRef.get();

  // Auto-create user if not exists
  if (!userDoc.exists) {
    const newUserData = {
      uid,
      createdAt: admin.firestore.Timestamp.now(),
      lastActiveAt: admin.firestore.Timestamp.now(),
      subscription: {
        status: 'inactive',
        plan: 'free',
      },
      usage: {
        totalJobs: 0,
        analysisToday: 0,
        tryOnToday: 0,
        lastJobDate: admin.firestore.Timestamp.now(),
      },
      flags: {
        isBlocked: false,
        isVIP: false,
        isAdmin: false,
      },
    };

    await userRef.set(newUserData);

    return {
      isValid: true,
      isBlocked: false,
      isPremium: false,
      remainingJobs: 30,
      analysisToday: 0,
    };
  }

  const userData = userDoc.data()!;
  const isPremium = userData.subscription?.status === 'active';
  const isBlocked = userData.flags?.isBlocked === true;

  const today = new Date().toDateString();
  const lastActivityDate = userData.usage?.lastJobDate?.toDate()?.toDateString();
  const isSameDay = lastActivityDate === today;

  const analysisToday = isSameDay ? (userData.usage?.analysisToday || 0) : 0;
  const DAILY_LIMIT = 30;
  const remainingJobs = Math.max(0, DAILY_LIMIT - analysisToday);

  return {
    isValid: true,
    isBlocked,
    isPremium,
    remainingJobs,
    analysisToday,
  };
}

// Increment usage counter
async function incrementUsage(uid: string): Promise<void> {
  const userRef = db.collection('users').doc(uid);
  const today = new Date();

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      return;
    }

    const userData = userDoc.data()!;
    const lastJobDate = userData.usage?.lastJobDate?.toDate();
    const isSameDay = lastJobDate?.toDateString() === today.toDateString();

    const updates: any = {
      'usage.totalJobs': admin.firestore.FieldValue.increment(1),
      'usage.lastJobDate': admin.firestore.Timestamp.now(),
      'lastActiveAt': admin.firestore.Timestamp.now(),
    };

    updates['usage.analysisToday'] = isSameDay
      ? admin.firestore.FieldValue.increment(1)
      : 1;

    transaction.update(userRef, updates);
  });
}

// Build analysis prompt
function buildAnalysisPrompt(
  language: 'tr' | 'en',
  userPreferences?: {
    stylePreferences?: string[];
    bodyType?: string;
    favoriteColors?: string[];
    usageGoals?: string[];
  },
  purposes?: string[]
): string {
  const basePrompt = language === 'tr'
    ? `Sen profesyonel bir stil analisti ve moda danışmanısın.

ÖNEMLİ: GÖRSELDE GÖRDÜĞÜN KIYAFETI GERÇEKTEN DETAYLI ANALİZ ET!
- Her görseli benzersiz olarak değerlendir
- Renkler, desenler, kesim, kumaş detaylarını DİKKATLİCE incele
- Fotoğraftaki KİŞİYİ de dikkate al (vücut tipi, cilt tonu)

MİSYONUN:
- Verilen kıyafeti her açıdan profesyonel olarak değerlendirmek
- Renk uyumu, kesim, kumaş kalitesi analiz etmek
- Kişisel stil önerileri sunmak

DEĞERLENDİRME KRİTERLERİN (GERÇEKÇI PUANLA):
1. Renk Harmonisi (0-10)
2. Kesim ve Kalıp (0-10)
3. Kumaş ve Doku (0-10)
4. Trend ve Zamansızlık (0-10)
5. Aksesuar Uyumu (0-10)
6. Amaç Uygunluğu (0-10)

overallScore = 6 kriterin ortalaması

TÜM YANITLARINI TÜRKÇE VER. JSON formatında detaylı analiz sun.`
    : `You are a professional style analyst and fashion consultant.

IMPORTANT: REALLY ANALYZE THE OUTFIT YOU SEE IN DETAIL!
- Evaluate each image uniquely
- CAREFULLY examine colors, patterns, cut, fabric details
- Consider the PERSON in the photo (body type, skin tone)

YOUR MISSION:
- Professionally evaluate the outfit from every angle
- Analyze color harmony, cut, fabric quality
- Provide personal style recommendations

YOUR EVALUATION CRITERIA (SCORE REALISTICALLY):
1. Color Harmony (0-10)
2. Cut and Fit (0-10)
3. Fabric and Texture (0-10)
4. Trend and Timelessness (0-10)
5. Accessory Harmony (0-10)
6. Purpose Suitability (0-10)

overallScore = average of 6 criteria

RESPOND IN ENGLISH. Provide detailed analysis in JSON format.`;

  let prompt = basePrompt;

  // Add purposes if provided
  if (purposes && purposes.length > 0) {
    const purposeDesc = purposes.join(', ');
    if (language === 'tr') {
      prompt += `\n\nANALİZ AMAÇLARI: ${purposeDesc}`;
    } else {
      prompt += `\n\nANALYSIS PURPOSES: ${purposeDesc}`;
    }
  }

  // Add user preferences if provided
  if (userPreferences) {
    if (language === 'tr') {
      prompt += '\n\nKULLANICI TERCİHLERİ:';
      if (userPreferences.stylePreferences?.length) {
        prompt += `\n- Tercih edilen stiller: ${userPreferences.stylePreferences.join(', ')}`;
      }
      if (userPreferences.bodyType) {
        prompt += `\n- Vücut tipi: ${userPreferences.bodyType}`;
      }
      if (userPreferences.favoriteColors?.length) {
        prompt += `\n- Favori renkler: ${userPreferences.favoriteColors.join(', ')}`;
      }
    } else {
      prompt += '\n\nUSER PREFERENCES:';
      if (userPreferences.stylePreferences?.length) {
        prompt += `\n- Preferred styles: ${userPreferences.stylePreferences.join(', ')}`;
      }
      if (userPreferences.bodyType) {
        prompt += `\n- Body type: ${userPreferences.bodyType}`;
      }
      if (userPreferences.favoriteColors?.length) {
        prompt += `\n- Favorite colors: ${userPreferences.favoriteColors.join(', ')}`;
      }
    }
  }

  const jsonFormat = language === 'tr'
    ? `

YANIT FORMATI - SADECE ŞU JSON YAPISINDA CEVAP VER:
{
  "overallScore": 8.5,
  "suitabilityLevel": "Harika",
  "overallComment": "Detaylı açıklama (en az 2-3 cümle)",
  "items": [
    {
      "name": "Elbise",
      "color": "Krem",
      "style": "Bohemian",
      "fit": "Bol kesim",
      "material": "Pamuklu",
      "quality": "Yüksek kalite"
    }
  ],
  "colorHarmony": {
    "score": 8.5,
    "comment": "Detaylı açıklama",
    "dominantColors": ["Krem", "Beyaz"],
    "suggestions": ["Renk önerisi..."]
  },
  "styleMatch": {
    "score": 8.0,
    "detectedStyle": "Bohemian Şık",
    "comment": "Detaylı açıklama",
    "occasion": "Günlük kullanım, Akşam yemeği",
    "purposeSuitability": "Amaç için uygunluk açıklaması"
  },
  "seasonMatch": {
    "score": 9.0,
    "suitableSeasons": ["İlkbahar", "Yaz"],
    "comment": "Detaylı açıklama"
  },
  "suggestions": [
    "AKSESUAR: Minimal takılar",
    "AYAKKABI: Topuklu",
    "ÇANTA: Clutch"
  ],
  "alternatives": [
    "Alternatif öneri 1",
    "Alternatif öneri 2"
  ],
  "detailedScores": {
    "colorHarmony": 8.5,
    "cutAndFit": 8.0,
    "fabricQuality": 8.5,
    "trendAlignment": 7.5,
    "accessoryMatch": 8.0,
    "purposeSuitability": 9.0
  },
  "expertTips": [
    "Uzman ipucu 1",
    "Uzman ipucu 2"
  ]
}`
    : `

RESPONSE FORMAT - RESPOND ONLY IN THIS JSON STRUCTURE:
{
  "overallScore": 8.5,
  "suitabilityLevel": "Great",
  "overallComment": "Detailed explanation (at least 2-3 sentences)",
  "items": [
    {
      "name": "Dress",
      "color": "Cream",
      "style": "Bohemian",
      "fit": "Loose fit",
      "material": "Cotton",
      "quality": "High quality"
    }
  ],
  "colorHarmony": {
    "score": 8.5,
    "comment": "Detailed explanation",
    "dominantColors": ["Cream", "White"],
    "suggestions": ["Color suggestion..."]
  },
  "styleMatch": {
    "score": 8.0,
    "detectedStyle": "Bohemian Chic",
    "comment": "Detailed explanation",
    "occasion": "Casual wear, Dinner",
    "purposeSuitability": "Purpose suitability explanation"
  },
  "seasonMatch": {
    "score": 9.0,
    "suitableSeasons": ["Spring", "Summer"],
    "comment": "Detailed explanation"
  },
  "suggestions": [
    "ACCESSORY: Minimal jewelry",
    "SHOES: Heels",
    "BAG: Clutch"
  ],
  "alternatives": [
    "Alternative suggestion 1",
    "Alternative suggestion 2"
  ],
  "detailedScores": {
    "colorHarmony": 8.5,
    "cutAndFit": 8.0,
    "fabricQuality": 8.5,
    "trendAlignment": 7.5,
    "accessoryMatch": 8.0,
    "purposeSuitability": 9.0
  },
  "expertTips": [
    "Expert tip 1",
    "Expert tip 2"
  ]
}`;

  return prompt + jsonFormat;
}

// MINIMAL ANALYSIS FUNCTION
export const analyzeOutfitMinimal = onCall(
  {
    region: 'europe-west1',
    timeoutSeconds: 30, // Shorter timeout
    memory: '512MiB', // Less memory
    secrets: [openaiApiKey],
  },
  async (request) => {
    const startTime = Date.now();
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log(`[analyzeOutfitMinimal][${requestId}] ===== NEW REQUEST =====`);
    console.log(`[analyzeOutfitMinimal][${requestId}] Timestamp: ${new Date().toISOString()}`);

    try {
      // 1. Authentication check
      if (!request.auth) {
        console.error(`[analyzeOutfitMinimal][${requestId}] Authentication failed: No auth token`);
        throw new HttpsError('unauthenticated', 'Giriş yapmanız gerekiyor');
      }

      const uid = request.auth.uid;
      console.log(`[analyzeOutfitMinimal][${requestId}] User ID: ${uid}`);

      // 2. Verify user (auto-create if needed)
      const userStatus = await verifyUser(uid);

      if (!userStatus.isValid) {
        throw new HttpsError('not-found', 'Kullanıcı bulunamadı');
      }

      if (userStatus.isBlocked) {
        throw new HttpsError('permission-denied', 'Hesabınız bloke edilmiş');
      }

      // 3. Data validation
      const { imageBase64, language = 'tr', userPreferences, purposes = ['general'] } = request.data;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        console.error(`[analyzeOutfitMinimal][${requestId}] Invalid image data: ${typeof imageBase64}`);
        throw new HttpsError('invalid-argument', 'Görsel verisi gerekli');
      }

      const imageSize = Math.round(imageBase64.length / 1024);
      console.log(`[analyzeOutfitMinimal][${requestId}] Image size: ${imageSize}KB`);
      console.log(`[analyzeOutfitMinimal][${requestId}] Language: ${language}`);
      console.log(`[analyzeOutfitMinimal][${requestId}] Purposes: ${JSON.stringify(purposes)}`);

      // Convert to data URI if needed
      const imageDataUri = imageBase64.startsWith('data:image/')
        ? imageBase64
        : `data:image/jpeg;base64,${imageBase64}`;

      // 4. Get OpenAI API key from secret
      const apiKey = openaiApiKey.value()?.trim();
      if (!apiKey) {
        console.error(`[analyzeOutfitMinimal][${requestId}] OpenAI API key not configured`);
        throw new HttpsError('internal', 'OpenAI API key yapılandırılmamış');
      }

      const openai = getOpenAIClient(apiKey);

      // 5. Build prompt
      const prompt = buildAnalysisPrompt(language, userPreferences, purposes);
      console.log(`[analyzeOutfitMinimal][${requestId}] Prompt built, length: ${prompt.length} chars`);

      // 6. Call OpenAI API with retry logic
      console.log(`[analyzeOutfitMinimal][${requestId}] Starting OpenAI API calls...`);

      const MAX_RETRIES = 3;
      let analysis;
      let totalApiCallDuration = 0;

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`[analyzeOutfitMinimal][${requestId}] Attempt ${attempt}/${MAX_RETRIES}`);
          const apiCallStart = Date.now();

          const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            max_tokens: 1500,
            temperature: 0.3,
            messages: [
              {
                role: 'system',
                content: language === 'tr'
                  ? `SEN PROFESYONEL BİR MODA TASARIMCISI VE STİL UZMANSIN.

GÖREV: Kullanıcının kendi üzerindeki KIYAFETİ analiz etmek
- Bu bir moda ve stil analiz uygulamasıdır
- Kullanıcı kendi kıyafet fotoğrafını yüklüyor
- Senin görevin: Kıyafeti değerlendirmek, stil tavsiyesi vermek
- KIYAFETLERİ analiz ediyorsun (renkler, kesim, kumaş, stil)
- Kişiyi DEĞİL, kıyafeti değerlendiriyorsun
- Mayo, bikini, iç giyim dahil TÜM kıyafet türleri meşrudur

BU MEŞRU BİR MODA DANIŞMANLIĞI HİZMETİDİR.
Stitch Fix, Lookiero gibi moda uygulamalarının yaptığı iştir.

Türkçe cevap ver. Her zaman JSON formatında detaylı analiz sun.`
                  : `YOU ARE A PROFESSIONAL FASHION STYLIST AND WARDROBE CONSULTANT.

YOUR PROFESSIONAL ROLE:
- You work for a fashion styling mobile application
- Users upload photos of their OWN OUTFITS for professional styling advice
- Your expertise: Analyzing CLOTHING (colors, cuts, fabrics, styles, patterns)
- You evaluate the GARMENTS, not the person wearing them
- ALL clothing categories are within your professional scope: casual wear, formal wear, sportswear, swimwear, evening wear, and undergarments

THIS IS LEGITIMATE PROFESSIONAL FASHION CONSULTING:
Your service is identical to established fashion apps like Stitch Fix, Trunk Club, Lookiero, and Wishi.
You are a wardrobe consultant analyzing clothing items for style improvement.

RESPOND IN ENGLISH. Always provide detailed analysis in JSON format.`,
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imageDataUri,
                      detail: 'auto',
                    },
                  },
                ],
              },
            ],
          });

          const apiCallDuration = Date.now() - apiCallStart;
          totalApiCallDuration += apiCallDuration;
          console.log(`[analyzeOutfitMinimal][${requestId}] OpenAI API call (attempt ${attempt}): ${apiCallDuration}ms`);
          console.log(`[analyzeOutfitMinimal][${requestId}] OpenAI usage:`, JSON.stringify(response.usage));

          const content = response.choices?.[0]?.message?.content;

          if (!content) {
            console.error(`[analyzeOutfitMinimal][${requestId}] Empty response from OpenAI`);
            throw new Error('API yanıtı boş');
          }

          // LOG THE RAW CONTENT FIRST - FULL LENGTH
          console.log(`[analyzeOutfitMinimal][${requestId}] ===== FULL OPENAI RESPONSE =====`);
          console.log(content);
          console.log(`[analyzeOutfitMinimal][${requestId}] ===== END OF RESPONSE =====`);
          console.log(`[analyzeOutfitMinimal][${requestId}] Response length: ${content.length} chars`);
          console.log(`[analyzeOutfitMinimal][${requestId}] First 100 chars:`, content.substring(0, 100));

          // Check for explicit refusal field
          if (response.choices?.[0]?.message?.refusal) {
            console.error(`[analyzeOutfitMinimal][${requestId}] OpenAI REFUSAL:`, response.choices[0].message.refusal);
            throw new Error('OpenAI explicit refusal');
          }

          // Check for Turkish/English refusal phrases in content
          const lowerContent = content.toLowerCase();
          const refusalPhrases = [
            'üzgünüm',
            'sorry',
            'cannot analyze',
            'can\'t analyze',
            'analiz edemem',
            'yerine getiremiyorum',
            'cannot fulfill',
            'inappropriate',
            'uygunsuz'
          ];

          const hasRefusalPhrase = refusalPhrases.some(phrase => lowerContent.includes(phrase));
          if (hasRefusalPhrase && !content.includes('{')) {
            console.warn(`[analyzeOutfitMinimal] Detected refusal phrase in response (attempt ${attempt})`);
            throw new Error('OpenAI content refusal');
          }

          // 7. Parse JSON with multiple fallback strategies
          let jsonString = content;
          let parseStrategy = 'unknown';

          // Strategy 1: Try parsing as-is (if already valid JSON)
          if (content.trim().startsWith('{')) {
            try {
              analysis = JSON.parse(content.trim());
              parseStrategy = 'direct';
              console.log('[analyzeOutfitMinimal] ✅ Parsed directly (Strategy 1)');
            } catch (e) {
              // Continue to other strategies
              console.log('[analyzeOutfitMinimal] Strategy 1 failed, trying markdown block');
            }
          }

          // Strategy 2: Extract from markdown JSON block
          if (!analysis) {
            const jsonBlockMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
            if (jsonBlockMatch) {
              console.log('[analyzeOutfitMinimal] Found JSON code block (Strategy 2)');
              jsonString = jsonBlockMatch[1];
              try {
                analysis = JSON.parse(jsonString.trim());
                parseStrategy = 'markdown-json';
                console.log('[analyzeOutfitMinimal] ✅ Parsed from JSON markdown block (Strategy 2)');
              } catch (e) {
                console.log('[analyzeOutfitMinimal] Strategy 2 failed, trying generic code block');
              }
            }
          }

          // Strategy 3: Extract from generic code block
          if (!analysis) {
            const codeBlockMatch = content.match(/```\s*\n([\s\S]*?)\n```/);
            if (codeBlockMatch) {
              console.log('[analyzeOutfitMinimal] Found generic code block (Strategy 3)');
              jsonString = codeBlockMatch[1];
              try {
                analysis = JSON.parse(jsonString.trim());
                parseStrategy = 'markdown-generic';
                console.log('[analyzeOutfitMinimal] ✅ Parsed from generic markdown block (Strategy 3)');
              } catch (e) {
                console.log('[analyzeOutfitMinimal] Strategy 3 failed, trying direct extraction');
              }
            }
          }

          // Strategy 4: Direct brace extraction
          if (!analysis) {
            const firstBrace = content.indexOf('{');
            const lastBrace = content.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              jsonString = content.substring(firstBrace, lastBrace + 1);
              console.log('[analyzeOutfitMinimal] Extracted JSON from braces (Strategy 4)');
              try {
                analysis = JSON.parse(jsonString.trim());
                parseStrategy = 'brace-extraction';
                console.log('[analyzeOutfitMinimal] ✅ Parsed from brace extraction (Strategy 4)');
              } catch (e) {
                console.log('[analyzeOutfitMinimal] Strategy 4 failed, trying repair strategies');
              }
            } else {
              console.error('[analyzeOutfitMinimal] No JSON braces found in response');
            }
          }

          // Strategy 5: Try to repair common JSON issues
          if (!analysis && jsonString) {
            try {
              // Remove trailing commas before closing braces/brackets
              let repairedJson = jsonString
                .replace(/,(\s*[}\]])/g, '$1')
                // Fix unescaped quotes in strings (basic attempt)
                .replace(/:\s*"([^"]*)"([^,}\]]*?)"/g, ':"$1\\"$2"');

              analysis = JSON.parse(repairedJson.trim());
              parseStrategy = 'repaired';
              console.log('[analyzeOutfitMinimal] ✅ Parsed after JSON repair (Strategy 5)');
            } catch (e) {
              console.log('[analyzeOutfitMinimal] Strategy 5 (repair) failed');
            }
          }

          // If all strategies failed, throw error
          if (!analysis) {
            console.error('[analyzeOutfitMinimal] All JSON parsing strategies failed');
            console.error('[analyzeOutfitMinimal] Content length:', content.length);
            console.error('[analyzeOutfitMinimal] First 500 chars:', content.substring(0, 500));
            throw new Error('No valid JSON found in response after all strategies');
          }

          console.log('[analyzeOutfitMinimal] Final parse strategy used:', parseStrategy);
          console.log('[analyzeOutfitMinimal] Final JSON string length:', jsonString.length);
          console.log(`[analyzeOutfitMinimal] ✅ JSON parse successful on attempt ${attempt}`);

          // SUCCESS - break out of retry loop
          break;

        } catch (parseError: any) {
          console.error(`[analyzeOutfitMinimal] ❌ Error on attempt ${attempt}/${MAX_RETRIES}`);
          console.error('[analyzeOutfitMinimal] Error message:', parseError.message);

          // If this is the last attempt, throw the error
          if (attempt === MAX_RETRIES) {
            console.error('[analyzeOutfitMinimal] All retry attempts exhausted');
            console.error('[analyzeOutfitMinimal] Final error:', parseError);
            throw new HttpsError('internal', 'Analiz sonucu işlenemedi. Lütfen tekrar deneyin.');
          }

          // Wait before retrying (exponential backoff: 1s, 2s, 4s)
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`[analyzeOutfitMinimal] Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      // If we somehow exit the loop without analysis, throw error
      if (!analysis) {
        console.error(`[analyzeOutfitMinimal][${requestId}] Exited retry loop without analysis`);
        throw new HttpsError('internal', 'Analiz tamamlanamadı');
      }

      // 8. Increment usage counter
      await incrementUsage(uid);

      const totalDuration = Date.now() - startTime;
      console.log(`[analyzeOutfitMinimal][${requestId}] ✅ SUCCESS in ${totalDuration}ms (OpenAI: ${totalApiCallDuration}ms)`);
      console.log(`[analyzeOutfitMinimal][${requestId}] User: ${uid}, Remaining analyses: ${30 - (userStatus.analysisToday + 1)}`);

      return {
        success: true,
        analysis,
        timestamp: Date.now(),
        remaining: 30 - (userStatus.analysisToday + 1),
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[analyzeOutfitMinimal][${requestId}] ❌ FAILED after ${duration}ms`);
      console.error(`[analyzeOutfitMinimal][${requestId}] Error:`, error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError('internal', 'Analiz sırasında bir hata oluştu');
    }
  }
);
