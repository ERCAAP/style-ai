"use strict";
// Minimal Analysis Function
// Firebase Secret'ten OpenAI key kullanarak hızlı analiz
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeOutfitMinimal = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const openai_1 = __importDefault(require("openai"));
// Firestore database
const db = admin.firestore();
// OpenAI API key secret
const openaiApiKey = (0, params_1.defineSecret)('OPENAI_API_KEY');
// OpenAI client singleton
let openaiClient = null;
function getOpenAIClient(apiKey) {
    if (!openaiClient) {
        openaiClient = new openai_1.default({ apiKey });
    }
    return openaiClient;
}
// User verification (auto-create if not exists)
async function verifyUser(uid) {
    var _a, _b, _c, _d, _e, _f;
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
    const userData = userDoc.data();
    const isPremium = ((_a = userData.subscription) === null || _a === void 0 ? void 0 : _a.status) === 'active';
    const isBlocked = ((_b = userData.flags) === null || _b === void 0 ? void 0 : _b.isBlocked) === true;
    const today = new Date().toDateString();
    const lastActivityDate = (_e = (_d = (_c = userData.usage) === null || _c === void 0 ? void 0 : _c.lastJobDate) === null || _d === void 0 ? void 0 : _d.toDate()) === null || _e === void 0 ? void 0 : _e.toDateString();
    const isSameDay = lastActivityDate === today;
    const analysisToday = isSameDay ? (((_f = userData.usage) === null || _f === void 0 ? void 0 : _f.analysisToday) || 0) : 0;
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
async function incrementUsage(uid) {
    const userRef = db.collection('users').doc(uid);
    const today = new Date();
    await db.runTransaction(async (transaction) => {
        var _a, _b;
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            return;
        }
        const userData = userDoc.data();
        const lastJobDate = (_b = (_a = userData.usage) === null || _a === void 0 ? void 0 : _a.lastJobDate) === null || _b === void 0 ? void 0 : _b.toDate();
        const isSameDay = (lastJobDate === null || lastJobDate === void 0 ? void 0 : lastJobDate.toDateString()) === today.toDateString();
        const updates = {
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
function buildAnalysisPrompt(language, userPreferences, purposes) {
    var _a, _b, _c, _d;
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
        }
        else {
            prompt += `\n\nANALYSIS PURPOSES: ${purposeDesc}`;
        }
    }
    // Add user preferences if provided
    if (userPreferences) {
        if (language === 'tr') {
            prompt += '\n\nKULLANICI TERCİHLERİ:';
            if ((_a = userPreferences.stylePreferences) === null || _a === void 0 ? void 0 : _a.length) {
                prompt += `\n- Tercih edilen stiller: ${userPreferences.stylePreferences.join(', ')}`;
            }
            if (userPreferences.bodyType) {
                prompt += `\n- Vücut tipi: ${userPreferences.bodyType}`;
            }
            if ((_b = userPreferences.favoriteColors) === null || _b === void 0 ? void 0 : _b.length) {
                prompt += `\n- Favori renkler: ${userPreferences.favoriteColors.join(', ')}`;
            }
        }
        else {
            prompt += '\n\nUSER PREFERENCES:';
            if ((_c = userPreferences.stylePreferences) === null || _c === void 0 ? void 0 : _c.length) {
                prompt += `\n- Preferred styles: ${userPreferences.stylePreferences.join(', ')}`;
            }
            if (userPreferences.bodyType) {
                prompt += `\n- Body type: ${userPreferences.bodyType}`;
            }
            if ((_d = userPreferences.favoriteColors) === null || _d === void 0 ? void 0 : _d.length) {
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
exports.analyzeOutfitMinimal = (0, https_1.onCall)({
    region: 'europe-west1',
    timeoutSeconds: 30, // Shorter timeout
    memory: '512MiB', // Less memory
    secrets: [openaiApiKey],
}, async (request) => {
    var _a, _b, _c, _d, _e, _f, _g;
    const startTime = Date.now();
    try {
        // 1. Authentication check
        if (!request.auth) {
            throw new https_1.HttpsError('unauthenticated', 'Giriş yapmanız gerekiyor');
        }
        const uid = request.auth.uid;
        // 2. Verify user (auto-create if needed)
        const userStatus = await verifyUser(uid);
        if (!userStatus.isValid) {
            throw new https_1.HttpsError('not-found', 'Kullanıcı bulunamadı');
        }
        if (userStatus.isBlocked) {
            throw new https_1.HttpsError('permission-denied', 'Hesabınız bloke edilmiş');
        }
        // 3. Data validation
        const { imageBase64, language = 'tr', userPreferences, purposes = ['general'] } = request.data;
        if (!imageBase64 || typeof imageBase64 !== 'string') {
            throw new https_1.HttpsError('invalid-argument', 'Görsel verisi gerekli');
        }
        // Convert to data URI if needed
        const imageDataUri = imageBase64.startsWith('data:image/')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;
        // 4. Get OpenAI API key from secret
        const apiKey = (_a = openaiApiKey.value()) === null || _a === void 0 ? void 0 : _a.trim();
        if (!apiKey) {
            throw new https_1.HttpsError('internal', 'OpenAI API key yapılandırılmamış');
        }
        const openai = getOpenAIClient(apiKey);
        // 5. Build prompt
        const prompt = buildAnalysisPrompt(language, userPreferences, purposes);
        // 6. Call OpenAI API with retry logic
        console.log(`[analyzeOutfitMinimal] Starting analysis for ${uid}...`);
        const MAX_RETRIES = 3;
        let analysis;
        let totalApiCallDuration = 0;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`[analyzeOutfitMinimal] Attempt ${attempt}/${MAX_RETRIES}`);
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
                console.log(`[Performance] OpenAI API call (attempt ${attempt}): ${apiCallDuration}ms`);
                const content = (_d = (_c = (_b = response.choices) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.message) === null || _d === void 0 ? void 0 : _d.content;
                if (!content) {
                    throw new Error('API yanıtı boş');
                }
                // LOG THE RAW CONTENT FIRST - FULL LENGTH
                console.log('[analyzeOutfitMinimal] ===== FULL OPENAI RESPONSE =====');
                console.log(content);
                console.log('[analyzeOutfitMinimal] ===== END OF RESPONSE =====');
                console.log('[analyzeOutfitMinimal] Response length:', content.length);
                console.log('[analyzeOutfitMinimal] First 100 chars:', content.substring(0, 100));
                // Check for explicit refusal field
                if ((_g = (_f = (_e = response.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.refusal) {
                    console.error('[analyzeOutfitMinimal] OpenAI REFUSAL:', response.choices[0].message.refusal);
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
                // 7. Parse JSON
                let jsonString = content;
                // Extract JSON from markdown code blocks
                const jsonBlockMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
                if (jsonBlockMatch) {
                    console.log('[analyzeOutfitMinimal] Found JSON code block');
                    jsonString = jsonBlockMatch[1];
                }
                else {
                    const codeBlockMatch = content.match(/```\s*\n([\s\S]*?)\n```/);
                    if (codeBlockMatch) {
                        console.log('[analyzeOutfitMinimal] Found generic code block');
                        jsonString = codeBlockMatch[1];
                    }
                }
                // Extract JSON directly if no code block
                if (jsonString === content && !jsonString.trim().startsWith('{')) {
                    console.log('[analyzeOutfitMinimal] No code block, extracting JSON manually');
                    const firstBrace = content.indexOf('{');
                    const lastBrace = content.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonString = content.substring(firstBrace, lastBrace + 1);
                        console.log('[analyzeOutfitMinimal] Extracted JSON from index', firstBrace, 'to', lastBrace);
                    }
                    else {
                        console.error('[analyzeOutfitMinimal] No JSON braces found in response');
                        throw new Error('No JSON found in response');
                    }
                }
                console.log('[analyzeOutfitMinimal] Final JSON string length:', jsonString.length);
                console.log('[analyzeOutfitMinimal] Final JSON string (first 200 chars):', jsonString.substring(0, 200));
                analysis = JSON.parse(jsonString.trim());
                console.log(`[analyzeOutfitMinimal] ✅ JSON parse successful on attempt ${attempt}`);
                // SUCCESS - break out of retry loop
                break;
            }
            catch (parseError) {
                console.error(`[analyzeOutfitMinimal] ❌ Error on attempt ${attempt}/${MAX_RETRIES}`);
                console.error('[analyzeOutfitMinimal] Error message:', parseError.message);
                // If this is the last attempt, throw the error
                if (attempt === MAX_RETRIES) {
                    console.error('[analyzeOutfitMinimal] All retry attempts exhausted');
                    console.error('[analyzeOutfitMinimal] Final error:', parseError);
                    throw new https_1.HttpsError('internal', 'Analiz sonucu işlenemedi. Lütfen tekrar deneyin.');
                }
                // Wait before retrying (exponential backoff: 1s, 2s, 4s)
                const waitTime = Math.pow(2, attempt - 1) * 1000;
                console.log(`[analyzeOutfitMinimal] Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        // If we somehow exit the loop without analysis, throw error
        if (!analysis) {
            throw new https_1.HttpsError('internal', 'Analiz tamamlanamadı');
        }
        // 8. Increment usage counter
        await incrementUsage(uid);
        const totalDuration = Date.now() - startTime;
        console.log(`[analyzeOutfitMinimal] ✅ SUCCESS for ${uid} in ${totalDuration}ms (OpenAI total: ${totalApiCallDuration}ms)`);
        return {
            success: true,
            analysis,
            timestamp: Date.now(),
            remaining: 30 - (userStatus.analysisToday + 1),
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[analyzeOutfitMinimal] Error after ${duration}ms:`, error);
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        throw new https_1.HttpsError('internal', 'Analiz sırasında bir hata oluştu');
    }
});
//# sourceMappingURL=minimalAnalysis.js.map