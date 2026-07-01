// OpenAI Outfit Analysis Service
// Gorsel tabanli kiyafet analizi

import { OpenAIConfig, getOpenAIHeaders, isOpenAIConfigured } from './config';
import * as FileSystem from 'expo-file-system';
import { UserPreferences, StylePreference, BodyType, UsageGoal } from '@/types/user';

// Analiz sonucu tipleri
export interface OutfitAnalysisResult {
  success: boolean;
  analysis: OutfitAnalysis | null;
  error?: string;
}

export interface OutfitAnalysis {
  // Genel degerlendirme
  overallScore: number; // 1-10
  overallComment: string;

  // Kiyafet detaylari
  items: OutfitItem[];

  // Renk uyumu
  colorHarmony: {
    score: number; // 1-10
    comment: string;
    dominantColors: string[];
    suggestions: string[];
  };

  // Stil uyumu
  styleMatch: {
    score: number; // 1-10
    detectedStyle: string; // casual, formal, sporty, etc.
    comment: string;
    occasion: string; // bu kiyafet hangi ortamda uygun
  };

  // Mevsim uyumu
  seasonMatch: {
    score: number; // 1-10
    suitableSeasons: string[];
    comment: string;
  };

  // Oneriler
  suggestions: string[];

  // Alternatif kombinasyonlar
  alternatives: string[];
}

export interface OutfitItem {
  name: string; // gomlek, pantolon, ayakkabi, etc.
  color: string;
  style: string;
  fit: string; // dar, bol, normal
  material?: string;
  brand?: string;
}

// Stil tercihlerinin etiketleri
const STYLE_LABELS: Record<string, Record<StylePreference, string>> = {
  tr: {
    minimalist: 'Minimalist',
    classic: 'Klasik',
    casual: 'Günlük/Rahat',
    trendy: 'Trendy',
    elegant: 'Şık/Elegant',
    sporty: 'Sportif',
  },
  en: {
    minimalist: 'Minimalist',
    classic: 'Classic',
    casual: 'Casual',
    trendy: 'Trendy',
    elegant: 'Elegant',
    sporty: 'Sporty',
  },
};

// Vücut tipi etiketleri
const BODY_TYPE_LABELS: Record<string, Record<BodyType, string>> = {
  tr: {
    hourglass: 'Kum Saati',
    pear: 'Armut',
    apple: 'Elma',
    rectangle: 'Dikdörtgen',
    inverted_triangle: 'Ters Üçgen',
  },
  en: {
    hourglass: 'Hourglass',
    pear: 'Pear',
    apple: 'Apple',
    rectangle: 'Rectangle',
    inverted_triangle: 'Inverted Triangle',
  },
};

// Kullanım amacı etiketleri
const USAGE_GOAL_LABELS: Record<string, Record<UsageGoal, string>> = {
  tr: {
    daily: 'Günlük Giyim',
    work: 'İş/Ofis',
    special_occasions: 'Özel Günler',
    workout: 'Spor',
    travel: 'Seyahat',
  },
  en: {
    daily: 'Daily Wear',
    work: 'Work/Office',
    special_occasions: 'Special Occasions',
    workout: 'Workout',
    travel: 'Travel',
  },
};

// Kişiselleştirilmiş prompt oluştur
function buildPersonalizedPrompt(
  preferences?: UserPreferences,
  language: 'tr' | 'en' = 'tr'
): string {
  const lang = language;

  // Temel prompt - Türkçe
  const basePromptTR = `Sen bir profesyonel moda danismani ve stil uzmansin.
Verilen gorseldeki kiyafeti detayli analiz et ve Turkce olarak JSON formatinda yanit ver.`;

  // Temel prompt - İngilizce
  const basePromptEN = `You are a professional fashion consultant and style expert.
Analyze the outfit in the given image in detail and respond in English in JSON format.`;

  let prompt = lang === 'tr' ? basePromptTR : basePromptEN;

  // Kullanıcı tercihleri varsa ekle
  if (preferences) {
    if (lang === 'tr') {
      prompt += '\n\nKULLANICI TERCIHLERI (Analizi bu tercihlere gore kisiselestir):';

      if (preferences.stylePreferences && preferences.stylePreferences.length > 0) {
        const styles = preferences.stylePreferences.map(s => STYLE_LABELS.tr[s]).join(', ');
        prompt += `\n- Tercih ettigi stiller: ${styles}`;
      }

      if (preferences.bodyType) {
        prompt += `\n- Vucut tipi: ${BODY_TYPE_LABELS.tr[preferences.bodyType]}`;
      }

      if (preferences.favoriteColors && preferences.favoriteColors.length > 0) {
        prompt += `\n- Favori renkler: ${preferences.favoriteColors.join(', ')}`;
      }

      if (preferences.usageGoals && preferences.usageGoals.length > 0) {
        const goals = preferences.usageGoals.map(g => USAGE_GOAL_LABELS.tr[g]).join(', ');
        prompt += `\n- Kullanim amaclari: ${goals}`;
      }

      prompt += '\n\nBu tercihlere gore onerileri ve puanlamayi ayarla.';
    } else {
      prompt += '\n\nUSER PREFERENCES (Personalize the analysis based on these preferences):';

      if (preferences.stylePreferences && preferences.stylePreferences.length > 0) {
        const styles = preferences.stylePreferences.map(s => STYLE_LABELS.en[s]).join(', ');
        prompt += `\n- Preferred styles: ${styles}`;
      }

      if (preferences.bodyType) {
        prompt += `\n- Body type: ${BODY_TYPE_LABELS.en[preferences.bodyType]}`;
      }

      if (preferences.favoriteColors && preferences.favoriteColors.length > 0) {
        prompt += `\n- Favorite colors: ${preferences.favoriteColors.join(', ')}`;
      }

      if (preferences.usageGoals && preferences.usageGoals.length > 0) {
        const goals = preferences.usageGoals.map(g => USAGE_GOAL_LABELS.en[g]).join(', ');
        prompt += `\n- Usage goals: ${goals}`;
      }

      prompt += '\n\nAdjust recommendations and scoring based on these preferences.';
    }
  }

  // Analiz kriterleri
  const criteriaTR = `

Analiz kriterleri:
1. Kiyafetlerin genel uyumu (1-10 puan)
2. Renk uyumu ve harmonisi
3. Stil tutarliligi (casual, formal, sporty, elegant, bohemian, etc.)
4. Mevsime uygunluk
5. Her bir kiyafet parcasi icin detay (isim, renk, stil, kalip)
6. Iyilestirme onerileri
7. Alternatif kombinasyon onerileri`;

  const criteriaEN = `

Analysis criteria:
1. Overall outfit harmony (1-10 score)
2. Color harmony and coordination
3. Style consistency (casual, formal, sporty, elegant, bohemian, etc.)
4. Seasonal appropriateness
5. Details for each clothing item (name, color, style, fit)
6. Improvement suggestions
7. Alternative outfit suggestions`;

  prompt += lang === 'tr' ? criteriaTR : criteriaEN;

  // JSON format örneği
  const jsonFormatTR = `

ONEMLI: Yaniti SADECE asagidaki JSON formatinda ver, baska bir sey yazma:

{
  "overallScore": 8,
  "overallComment": "Genel degerlendirme yorumu",
  "items": [
    {
      "name": "Gomlek",
      "color": "Beyaz",
      "style": "Casual",
      "fit": "Normal",
      "material": "Pamuk"
    }
  ],
  "colorHarmony": {
    "score": 7,
    "comment": "Renk uyumu yorumu",
    "dominantColors": ["beyaz", "mavi"],
    "suggestions": ["Daha koyu bir ton eklenebilir"]
  },
  "styleMatch": {
    "score": 8,
    "detectedStyle": "Smart Casual",
    "comment": "Stil yorumu",
    "occasion": "Ofis, is gorusmesi"
  },
  "seasonMatch": {
    "score": 9,
    "suitableSeasons": ["Ilkbahar", "Sonbahar"],
    "comment": "Mevsim yorumu"
  },
  "suggestions": [
    "Oneri 1",
    "Oneri 2"
  ],
  "alternatives": [
    "Alternatif kombin 1",
    "Alternatif kombin 2"
  ]
}`;

  const jsonFormatEN = `

IMPORTANT: Respond ONLY in the following JSON format, do not write anything else:

{
  "overallScore": 8,
  "overallComment": "Overall evaluation comment",
  "items": [
    {
      "name": "Shirt",
      "color": "White",
      "style": "Casual",
      "fit": "Regular",
      "material": "Cotton"
    }
  ],
  "colorHarmony": {
    "score": 7,
    "comment": "Color harmony comment",
    "dominantColors": ["white", "blue"],
    "suggestions": ["A darker tone could be added"]
  },
  "styleMatch": {
    "score": 8,
    "detectedStyle": "Smart Casual",
    "comment": "Style comment",
    "occasion": "Office, job interview"
  },
  "seasonMatch": {
    "score": 9,
    "suitableSeasons": ["Spring", "Fall"],
    "comment": "Season comment"
  },
  "suggestions": [
    "Suggestion 1",
    "Suggestion 2"
  ],
  "alternatives": [
    "Alternative outfit 1",
    "Alternative outfit 2"
  ]
}`;

  prompt += lang === 'tr' ? jsonFormatTR : jsonFormatEN;

  return prompt;
}

// Legacy prompt (geriye uyumluluk)
const ANALYSIS_PROMPT = buildPersonalizedPrompt();

// Local URI'yi base64'e cevir
async function imageToBase64(uri: string): Promise<string> {
  try {
    // FileSystem modülü kontrol et
    if (!FileSystem || !FileSystem.EncodingType) {
      // Fallback: fetch ile base64'e çevir
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // data:image/...;base64, prefix'ini kaldır
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Image to base64 error:', error);
    throw new Error('Gorsel okunamadi');
  }
}

// Analiz secenekleri
export interface AnalysisOptions {
  language?: 'tr' | 'en';
  userPreferences?: UserPreferences;
}

// Ana analiz fonksiyonu
export async function analyzeOutfit(
  imageUri: string,
  options?: AnalysisOptions
): Promise<OutfitAnalysisResult> {
  const language = options?.language || 'tr';
  const userPreferences = options?.userPreferences;

  // API key kontrolu
  if (!isOpenAIConfigured()) {
    return {
      success: false,
      analysis: null,
      error: language === 'tr'
        ? 'OpenAI API key yapilandirilmamis'
        : 'OpenAI API key not configured',
    };
  }

  try {
    // Kişiselleştirilmiş prompt oluştur
    const prompt = buildPersonalizedPrompt(userPreferences, language);

    // Gorseli base64'e cevir
    const base64Image = await imageToBase64(imageUri);

    // MIME type belirle
    const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';

    // System message
    const systemMessage = language === 'tr'
      ? 'Sen profesyonel bir moda danismanisin. Her zaman JSON formatinda yanit verirsin.'
      : 'You are a professional fashion consultant. You always respond in JSON format.';

    // OpenAI API cagrisi
    const response = await fetch(`${OpenAIConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: getOpenAIHeaders(),
      body: JSON.stringify({
        model: OpenAIConfig.model,
        max_tokens: OpenAIConfig.maxTokens,
        temperature: OpenAIConfig.temperature,
        messages: [
          {
            role: 'system',
            content: systemMessage,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                  detail: 'high',
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);

      if (response.status === 401) {
        return {
          success: false,
          analysis: null,
          error: language === 'tr'
            ? 'Gecersiz API anahtari'
            : 'Invalid API key',
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          analysis: null,
          error: language === 'tr'
            ? 'API limit asildi, lutfen daha sonra tekrar deneyin'
            : 'API rate limit exceeded, please try again later',
        };
      }

      return {
        success: false,
        analysis: null,
        error: language === 'tr'
          ? `API hatasi: ${response.status}`
          : `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    // Yaniti parse et
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return {
        success: false,
        analysis: null,
        error: language === 'tr'
          ? 'API yaniti bos'
          : 'Empty API response',
      };
    }

    // Check for refusal messages before attempting JSON parse
    const refusalPatterns = [
      "I'm sorry",
      "I can't help",
      "I cannot help",
      "I'm unable to",
      "I am unable to",
      "I apologize",
      "cannot analyze",
      "can't analyze",
      "unable to analyze",
      "not able to",
    ];

    const isRefusal = refusalPatterns.some(pattern =>
      content.toLowerCase().includes(pattern.toLowerCase())
    );

    if (isRefusal) {
      console.error('API refused to analyze:', content);
      return {
        success: false,
        analysis: null,
        error: language === 'tr'
          ? 'Gorsel analiz edilemedi. Lutfen farkli bir kiyafet fotografi deneyin.'
          : 'Image could not be analyzed. Please try a different outfit photo.',
      };
    }

    // JSON'u parse et
    try {
      // Markdown code block varsa temizle
      let jsonString = content;
      if (content.includes('```json')) {
        jsonString = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (content.includes('```')) {
        jsonString = content.replace(/```\n?/g, '');
      }

      const analysis: OutfitAnalysis = JSON.parse(jsonString.trim());

      return {
        success: true,
        analysis,
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);

      return {
        success: false,
        analysis: null,
        error: language === 'tr'
          ? 'Analiz sonucu islenemedi'
          : 'Failed to process analysis result',
      };
    }
  } catch (error) {
    console.error('Analyze outfit error:', error);

    if (error instanceof Error) {
      return {
        success: false,
        analysis: null,
        error: error.message,
      };
    }

    return {
      success: false,
      analysis: null,
      error: language === 'tr'
        ? 'Beklenmeyen bir hata olustu'
        : 'An unexpected error occurred',
    };
  }
}

// Basit skor hesaplama (tum skorlarin ortalamasi)
export function calculateAverageScore(analysis: OutfitAnalysis): number {
  const scores = [
    analysis.overallScore,
    analysis.colorHarmony.score,
    analysis.styleMatch.score,
    analysis.seasonMatch.score,
  ];

  const average = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(average * 10) / 10;
}

// Skor seviyesi metni
export function getScoreLevel(score: number): 'low' | 'medium' | 'high' | 'excellent' {
  if (score >= 9) return 'excellent';
  if (score >= 7) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

// Skor seviyesi rengi
export function getScoreColor(score: number): string {
  if (score >= 9) return '#10B981'; // green
  if (score >= 7) return '#1A1A1A'; // rich black
  if (score >= 5) return '#F59E0B'; // amber
  return '#EF4444'; // red
}
