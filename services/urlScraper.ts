/**
 * URL Scraper Service
 * E-ticaret sitelerinden ürün görsellerini çekmek için kullanılır
 */

export interface ScrapedImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface ScrapeResult {
  success: boolean;
  images: ScrapedImage[];
  productImage: ScrapedImage | null;
  error?: string;
}

// Trendyol için özel görsel çıkarma fonksiyonu
function extractTrendyolImage(html: string): ScrapedImage | null {
  // 1. Öncelikle og:image'dan yüksek çözünürlüklü görsel al
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    let imageUrl = ogImageMatch[1];
    // Trendyol CDN URL'sini yüksek çözünürlüğe çevir
    // örn: /mnresize/128/192/ -> /mnresize/1200/1800/
    imageUrl = imageUrl.replace(/\/mnresize\/\d+\/\d+\//g, '/mnresize/1200/1800/');
    return { url: imageUrl, alt: 'Urun Gorseli' };
  }

  // 2. JSON-LD'den al
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        return { url: imgUrl, alt: data.name || 'Urun' };
      }
    } catch {}
  }

  return null;
}

/**
 * Zara API'den ürün bilgisi çeker
 */
async function fetchZaraProductAPI(productCode: string): Promise<ScrapedImage | null> {
  console.log(`[Scraper] Zara API deneniyor - Ürün kodu: ${productCode}`);

  // Zara'nın farklı API endpoint'leri
  const apiUrls = [
    `https://www.zara.com/tr/tr/products/${productCode}.json`,
    `https://www.zara.com/itxrest/2/catalog/store/54009/40259528/productsArray?productIds=${productCode}&languageId=-101`,
    `https://www.zara.com/itxrest/3/catalog/store/54009/40259528/category/0/product/${productCode}/detail`,
  ];

  for (const apiUrl of apiUrls) {
    try {
      console.log(`[Scraper] Zara API URL deneniyor: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Scraper] Zara API başarılı! Data:`, JSON.stringify(data).substring(0, 200));

        // Farklı response formatlarını dene
        let imageUrl = null;

        // Format 1: Direct image field
        if (data.image) {
          imageUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        }

        // Format 2: detail.colors[0].xmedia
        if (!imageUrl && data.detail?.colors?.[0]?.xmedia) {
          const media = data.detail.colors[0].xmedia[0];
          imageUrl = media?.url || media?.path;
        }

        // Format 3: product.images
        if (!imageUrl && data.product?.images) {
          imageUrl = data.product.images[0]?.url;
        }

        // Format 4: bundleProductSummaries
        if (!imageUrl && data.bundleProductSummaries?.[0]?.detail?.colors?.[0]?.image?.url) {
          imageUrl = data.bundleProductSummaries[0].detail.colors[0].image.url;
        }

        if (imageUrl) {
          // Relative URL ise absolute yap
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://static.zara.net' + imageUrl;
          }

          // Yüksek çözünürlüğe çevir
          imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');

          console.log(`[Scraper] ✅ Zara API'den görsel bulundu: ${imageUrl}`);
          return { url: imageUrl, alt: 'Zara Urun' };
        }
      }
    } catch (error) {
      console.log(`[Scraper] Zara API hatası:`, error);
      continue;
    }
  }

  console.log(`[Scraper] Zara API'lerinden görsel alınamadı`);
  return null;
}

// Zara için özel görsel çıkarma fonksiyonu
async function extractZaraImage(html: string, baseUrl: string, productCode: string | null): Promise<ScrapedImage | null> {
  console.log('[Scraper] Zara için özel çıkarma fonksiyonu çalışıyor...');

  // Önce API'yi dene
  if (productCode) {
    const apiImage = await fetchZaraProductAPI(productCode);
    if (apiImage) return apiImage;
  }

  // 1. Öncelikle og:image'dan al
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    let imageUrl = ogImageMatch[1];
    console.log('[Scraper] Zara og:image bulundu:', imageUrl);

    // Zara CDN URL'lerini yüksek çözünürlüğe çevir
    // Örnek: /p/06136/242/800/2/w/1126/06136242_800_2_1_1.jpg -> daha yüksek çözünürlük
    // Zara'nın URL yapısı genellikle /w/XXXXX/ şeklinde width içerir
    imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');

    return { url: imageUrl, alt: 'Zara Urun Gorseli' };
  }

  // 2. Twitter image meta tag
  const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    let imageUrl = twitterImageMatch[1];
    console.log('[Scraper] Zara twitter:image bulundu:', imageUrl);
    imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
    return { url: imageUrl, alt: 'Zara Urun Gorseli' };
  }

  // 3. JSON-LD structured data'dan al
  const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1]);

      // Product schema içinde image ara
      if (jsonData['@type'] === 'Product' && jsonData.image) {
        let imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
        if (typeof imageUrl === 'object') imageUrl = imageUrl.url;
        console.log('[Scraper] Zara JSON-LD Product image bulundu:', imageUrl);

        imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
        return { url: imageUrl, alt: jsonData.name || 'Zara Urun' };
      }

      // @graph içinde Product ara
      if (jsonData['@graph']) {
        for (const item of jsonData['@graph']) {
          if (item['@type'] === 'Product' && item.image) {
            let imageUrl = Array.isArray(item.image) ? item.image[0] : item.image;
            if (typeof imageUrl === 'object') imageUrl = imageUrl.url;
            console.log('[Scraper] Zara JSON-LD @graph image bulundu:', imageUrl);

            imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
            return { url: imageUrl, alt: item.name || 'Zara Urun' };
          }
        }
      }
    } catch (e) {
      console.log('[Scraper] JSON-LD parse hatası:', e);
    }
  }

  // 4. Zara'nın özel data attribute'larından ara
  // Örnek: data-product-image, data-media-url, vb.
  const dataMediaMatch = html.match(/data-media-url=["']([^"']+)["']/i);
  if (dataMediaMatch && dataMediaMatch[1]) {
    let imageUrl = dataMediaMatch[1];
    console.log('[Scraper] Zara data-media-url bulundu:', imageUrl);
    imageUrl = toAbsoluteUrl(imageUrl, baseUrl);
    imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
    return { url: imageUrl, alt: 'Zara Urun Gorseli' };
  }

  // 5. Picture source srcset'inden al
  const pictureSourceMatch = html.match(/<picture[^>]*>[\s\S]*?<source[^>]+srcset=["']([^"'\s]+)[^"']*["'][^>]*>/i);
  if (pictureSourceMatch && pictureSourceMatch[1]) {
    let imageUrl = pictureSourceMatch[1];
    console.log('[Scraper] Zara picture source bulundu:', imageUrl);
    imageUrl = toAbsoluteUrl(imageUrl, baseUrl);
    imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
    return { url: imageUrl, alt: 'Zara Urun Gorseli' };
  }

  // 6. Ürün görsellerini içeren img tag'lerini ara
  const productImgMatch = html.match(/<img[^>]+src=["']([^"']*(?:product|media)[^"']*)["'][^>]*>/i);
  if (productImgMatch && productImgMatch[1]) {
    let imageUrl = productImgMatch[1];
    console.log('[Scraper] Zara product img bulundu:', imageUrl);
    imageUrl = toAbsoluteUrl(imageUrl, baseUrl);
    imageUrl = imageUrl.replace(/\/w\/\d+\//g, '/w/2048/');
    return { url: imageUrl, alt: 'Zara Urun Gorseli' };
  }

  console.log('[Scraper] Zara için hiçbir görsel bulunamadı');
  return null;
}

// N11 için özel görsel çıkarma fonksiyonu
function extractN11Image(html: string): ScrapedImage | null {
  console.log('[Scraper] N11 için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] N11 og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'N11 Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] N11 JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'N11 Urun' };
      }
    } catch {}
  }

  // 3. imgObj class (N11'e özel)
  const imgObjMatch = html.match(/<img[^>]+class=["'][^"']*imgObj[^"']*["'][^>]+src=["']([^"']+)["']/i);
  if (imgObjMatch && imgObjMatch[1]) {
    console.log('[Scraper] N11 imgObj bulundu:', imgObjMatch[1]);
    return { url: imgObjMatch[1], alt: 'N11 Urun Gorseli' };
  }

  console.log('[Scraper] N11 için görsel bulunamadı');
  return null;
}

// Hepsiburada için özel görsel çıkarma fonksiyonu
function extractHepsiburadaImage(html: string): ScrapedImage | null {
  console.log('[Scraper] Hepsiburada için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    let imageUrl = ogImageMatch[1];
    console.log('[Scraper] Hepsiburada og:image bulundu:', imageUrl);
    // Hepsiburada CDN URL'lerini yüksek çözünürlüğe çevir
    imageUrl = imageUrl.replace(/\/\d+x\d+\//g, '/2000x2000/');
    return { url: imageUrl, alt: 'Hepsiburada Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        let imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Hepsiburada JSON-LD image bulundu:', imgUrl);
        imgUrl = imgUrl.replace(/\/\d+x\d+\//g, '/2000x2000/');
        return { url: imgUrl, alt: data.name || 'Hepsiburada Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Hepsiburada için görsel bulunamadı');
  return null;
}

// LC Waikiki için özel görsel çıkarma fonksiyonu
function extractLCWaikikiImage(html: string): ScrapedImage | null {
  console.log('[Scraper] LC Waikiki için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] LC Waikiki og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'LC Waikiki Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] LC Waikiki JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'LC Waikiki Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] LC Waikiki için görsel bulunamadı');
  return null;
}

// Koton için özel görsel çıkarma fonksiyonu
function extractKotonImage(html: string): ScrapedImage | null {
  console.log('[Scraper] Koton için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] Koton og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'Koton Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Koton JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'Koton Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Koton için görsel bulunamadı');
  return null;
}

// Defacto için özel görsel çıkarma fonksiyonu
function extractDefactoImage(html: string): ScrapedImage | null {
  console.log('[Scraper] Defacto için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] Defacto og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'Defacto Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Defacto JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'Defacto Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Defacto için görsel bulunamadı');
  return null;
}

// Mango için özel görsel çıkarma fonksiyonu
function extractMangoImage(html: string): ScrapedImage | null {
  console.log('[Scraper] Mango için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] Mango og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'Mango Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Mango JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'Mango Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Mango için görsel bulunamadı');
  return null;
}

// Boyner için özel görsel çıkarma fonksiyonu
function extractBoynerImage(html: string): ScrapedImage | null {
  console.log('[Scraper] Boyner için özel çıkarma fonksiyonu çalışıyor...');

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] Boyner og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'Boyner Urun Gorseli' };
  }

  // 2. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Boyner JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'Boyner Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Boyner için görsel bulunamadı');
  return null;
}

/**
 * Bershka API'den ürün bilgisi çeker
 */
async function fetchBershkaProductAPI(productCode: string): Promise<ScrapedImage | null> {
  console.log(`[Scraper] Bershka API deneniyor - Ürün kodu: ${productCode}`);

  // Bershka da Inditex grubu, benzer API yapısı
  const apiUrls = [
    `https://www.bershka.com/itxrest/2/catalog/store/45109/40259525/productsArray?productIds=${productCode}&languageId=-101`,
    `https://www.bershka.com/itxrest/3/catalog/store/45109/40259525/category/0/product/${productCode}/detail`,
  ];

  for (const apiUrl of apiUrls) {
    try {
      console.log(`[Scraper] Bershka API URL deneniyor: ${apiUrl}`);
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Scraper] Bershka API başarılı! Data:`, JSON.stringify(data).substring(0, 200));

        let imageUrl = null;

        // Zara ile aynı format
        if (data.detail?.colors?.[0]?.xmedia) {
          const media = data.detail.colors[0].xmedia[0];
          imageUrl = media?.url || media?.path;
        }

        if (!imageUrl && data.bundleProductSummaries?.[0]?.detail?.colors?.[0]?.image?.url) {
          imageUrl = data.bundleProductSummaries[0].detail.colors[0].image.url;
        }

        if (imageUrl) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else if (imageUrl.startsWith('/')) {
            imageUrl = 'https://static.bershka.net' + imageUrl;
          }

          console.log(`[Scraper] ✅ Bershka API'den görsel bulundu: ${imageUrl}`);
          return { url: imageUrl, alt: 'Bershka Urun' };
        }
      }
    } catch (error) {
      console.log(`[Scraper] Bershka API hatası:`, error);
      continue;
    }
  }

  console.log(`[Scraper] Bershka API'lerinden görsel alınamadı`);
  return null;
}

// Bershka için özel görsel çıkarma fonksiyonu
async function extractBershkaImage(html: string, url: string): Promise<ScrapedImage | null> {
  console.log('[Scraper] Bershka için özel çıkarma fonksiyonu çalışıyor...');

  // Ürün kodunu çıkar
  const productIdMatch = url.match(/p(\d+)\.html/);

  // Önce API'yi dene
  if (productIdMatch) {
    const productCode = productIdMatch[1];
    const apiImage = await fetchBershkaProductAPI(productCode);
    if (apiImage) return apiImage;
  }

  // 1. og:image meta tag
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    console.log('[Scraper] Bershka og:image bulundu:', ogImageMatch[1]);
    return { url: ogImageMatch[1], alt: 'Bershka Urun Gorseli' };
  }

  // 2. Twitter image
  const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    console.log('[Scraper] Bershka twitter:image bulundu:', twitterImageMatch[1]);
    return { url: twitterImageMatch[1], alt: 'Bershka Urun Gorseli' };
  }

  // 3. JSON-LD
  const jsonLdMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLdMatch) {
    try {
      const data = JSON.parse(jsonLdMatch[1]);
      if (data.image) {
        const imgUrl = Array.isArray(data.image) ? data.image[0] : data.image;
        console.log('[Scraper] Bershka JSON-LD image bulundu:', imgUrl);
        return { url: imgUrl, alt: data.name || 'Bershka Urun' };
      }
    } catch {}
  }

  console.log('[Scraper] Bershka için görsel bulunamadı');
  return null;
}

// Desteklenen e-ticaret siteleri için özel seçiciler
const SITE_SELECTORS: Record<string, string[]> = {
  'trendyol.com': [
    'meta[property="og:image"]',
  ],
  'hepsiburada.com': [
    'meta[property="og:image"]',
    '.product-image img',
    '#productImage',
    '.gallery img',
  ],
  'n11.com': [
    'meta[property="og:image"]',
    '.imgObj',
    '.proDetail img',
  ],
  'zara.com': [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="product:image"]',
    '.media-image img',
    '.media__wrapper img',
    '.product-detail-images img',
    'picture source',
    'img[data-src*="product"]',
    '[data-qa="product-image"] img',
    '.product-image img',
  ],
  'lcwaikiki.com': [
    'meta[property="og:image"]',
    '.product-image img',
    '.slick-slide img',
  ],
  'koton.com': [
    'meta[property="og:image"]',
    '.product-gallery img',
  ],
  'defacto.com.tr': [
    'meta[property="og:image"]',
    '.product-image img',
  ],
  'mango.com': [
    'meta[property="og:image"]',
    '.product-images img',
  ],
  'boyner.com.tr': [
    'meta[property="og:image"]',
    '.product-image img',
  ],
  'bershka.com': [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    '.product-image img',
  ],
};

// Genel görsel seçiciler (site spesifik olmayan)
const GENERAL_SELECTORS = [
  'meta[property="og:image"]',
  'meta[name="twitter:image"]',
  'meta[property="product:image"]',
  '[itemtype*="Product"] img',
  '.product-image img',
  '.product-gallery img',
  '#product-image img',
  '[data-product-image]',
  '.main-image img',
  '.hero-image img',
];

/**
 * URL'nin geçerli bir URL olup olmadığını kontrol eder
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * URL'den domain'i çıkarır
 */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

/**
 * Görsel URL'sini mutlak URL'ye çevirir
 */
function toAbsoluteUrl(imageUrl: string, baseUrl: string): string {
  if (!imageUrl) return '';

  // Zaten mutlak URL ise
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Protocol-relative URL
  if (imageUrl.startsWith('//')) {
    return 'https:' + imageUrl;
  }

  // Relative URL
  try {
    const base = new URL(baseUrl);
    return new URL(imageUrl, base.origin).href;
  } catch {
    return imageUrl;
  }
}

/**
 * HTML'den görselleri çıkarır
 */
function extractImagesFromHtml(html: string, baseUrl: string, domain: string): ScrapedImage[] {
  const images: ScrapedImage[] = [];
  const seenUrls = new Set<string>();

  // Site-spesifik seçiciler varsa önce onları dene
  const siteSelectors = SITE_SELECTORS[domain] || [];
  const allSelectors = [...siteSelectors, ...GENERAL_SELECTORS];

  // 1. OG:Image meta tag'i
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (ogImageMatch && ogImageMatch[1]) {
    const url = toAbsoluteUrl(ogImageMatch[1], baseUrl);
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      images.push({ url, alt: 'Product Image' });
    }
  }

  // 2. Twitter image meta tag
  const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  if (twitterImageMatch && twitterImageMatch[1]) {
    const url = toAbsoluteUrl(twitterImageMatch[1], baseUrl);
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      images.push({ url, alt: 'Product Image' });
    }
  }

  // 3. Product image meta tag
  const productImageMatch = html.match(/<meta[^>]+property=["']product:image["'][^>]+content=["']([^"']+)["']/i);
  if (productImageMatch && productImageMatch[1]) {
    const url = toAbsoluteUrl(productImageMatch[1], baseUrl);
    if (url && !seenUrls.has(url)) {
      seenUrls.add(url);
      images.push({ url, alt: 'Product Image' });
    }
  }

  // 4. JSON-LD structured data
  const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const jsonData = JSON.parse(match[1]);
      const imageUrl = jsonData.image || jsonData.images?.[0] || jsonData['@graph']?.[0]?.image;
      if (imageUrl) {
        const url = typeof imageUrl === 'string' ? imageUrl : imageUrl.url || imageUrl[0];
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url);
          images.push({ url: toAbsoluteUrl(url, baseUrl), alt: jsonData.name || 'Product' });
        }
      }
    } catch {
      // JSON parse hatası - devam et
    }
  }

  // 5. Büyük boyutlu img tag'leri
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    if (!src) continue;

    // Küçük ikonları ve placeholder'ları filtrele
    const isLikelyProductImage =
      !src.includes('icon') &&
      !src.includes('logo') &&
      !src.includes('placeholder') &&
      !src.includes('loading') &&
      !src.includes('spinner') &&
      !src.includes('avatar') &&
      !src.includes('1x1') &&
      !src.includes('pixel') &&
      (src.includes('product') ||
       src.includes('image') ||
       src.includes('photo') ||
       src.includes('item') ||
       src.includes('cdn') ||
       /\d{3,}x\d{3,}/.test(src) || // Boyut içeren URL'ler (örn: 800x1200)
       /\.(jpg|jpeg|png|webp)/i.test(src));

    if (isLikelyProductImage) {
      const url = toAbsoluteUrl(src, baseUrl);
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);

        // Alt text'i de al
        const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
        images.push({
          url,
          alt: altMatch?.[1] || undefined
        });
      }
    }
  }

  // 6. data-src (lazy loading)
  const dataSrcMatches = html.matchAll(/data-src=["']([^"']+)["']/gi);
  for (const match of dataSrcMatches) {
    const src = match[1];
    if (src && !src.includes('icon') && !src.includes('logo')) {
      const url = toAbsoluteUrl(src, baseUrl);
      if (url && !seenUrls.has(url) && /\.(jpg|jpeg|png|webp)/i.test(url)) {
        seenUrls.add(url);
        images.push({ url });
      }
    }
  }

  // 7. srcset'lerden en büyük görseli al
  const srcsetMatches = html.matchAll(/srcset=["']([^"']+)["']/gi);
  for (const match of srcsetMatches) {
    const srcset = match[1];
    const sources = srcset.split(',').map(s => s.trim());

    // En büyük boyutlu görseli bul
    let largestUrl = '';
    let largestSize = 0;

    for (const source of sources) {
      const parts = source.split(/\s+/);
      const srcUrl = parts[0];
      const sizeStr = parts[1] || '';
      const size = parseInt(sizeStr.replace(/\D/g, ''), 10) || 0;

      if (size > largestSize) {
        largestSize = size;
        largestUrl = srcUrl;
      }
    }

    if (largestUrl) {
      const url = toAbsoluteUrl(largestUrl, baseUrl);
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        images.push({ url });
      }
    }
  }

  return images;
}

/**
 * Görsel URL'lerini normalize ederek duplicate'ları kaldırır
 */
function normalizeImageUrl(url: string): string {
  // Trendyol resize parametrelerini kaldır
  let normalized = url.replace(/\/mnresize\/\d+\/\d+\//g, '/');
  // Query string'i kaldır
  normalized = normalized.split('?')[0];
  // Protocol kaldır
  normalized = normalized.replace(/^https?:\/\//, '');
  return normalized;
}

/**
 * Zara URL'sinden ürün kodunu çıkarır
 * Örnekler:
 * - https://www.zara.com/tr/tr/product-name-p06136242.html -> 06136242
 * - https://www.zara.com/tr/tr/product-p20120648.html -> 20120648
 */
function extractZaraProductCode(url: string): string | null {
  // -p ile başlayan ve ardından en az 8 hane gelen pattern
  const match = url.match(/-p(\d{8,})/);
  return match ? match[1] : null;
}

/**
 * Zara ürün kodundan olası görsel URL'lerini oluşturur
 * Zara CDN yapısı: https://static.zara.net/photos///p/STYLE/COLOR/SEASON/TYPE/w/WIDTH/FULLCODE_SEASON_TYPE_NUM_NUM.jpg
 */
function generateZaraImageUrls(productCode: string): string[] {
  const urls: string[] = [];

  // Ürün kodu 8 haneli ise style+color formatı
  if (productCode.length === 8) {
    const style = productCode.substring(0, 5); // 06136
    const color = productCode.substring(5); // 242

    // En yaygın kombinasyonlar (öncelik sırasına göre)
    const commonCombinations = [
      // En yaygın: season=800, type=2, width=2048
      { season: '800', type: '2', width: '2048' },
      { season: '800', type: '1', width: '2048' },
      { season: '802', type: '2', width: '2048' },
      { season: '804', type: '2', width: '2048' },

      // Alternatif width'ler
      { season: '800', type: '2', width: '1920' },
      { season: '800', type: '1', width: '1920' },

      // Diğer season'lar
      { season: '830', type: '2', width: '2048' },
      { season: '850', type: '2', width: '2048' },

      // Type 3 (yan görünüm)
      { season: '800', type: '3', width: '2048' },
      { season: '802', type: '3', width: '2048' },
    ];

    for (const { season, type, width } of commonCombinations) {
      const url = `https://static.zara.net/photos///p/${style}/${color}/${season}/${type}/w/${width}/${productCode}_${season}_${type}_1_1.jpg`;
      urls.push(url);
    }
  } else {
    // 8 haneli değilse, farklı pattern'ler dene
    // Örnek: 20120648 gibi kodlar için
    console.log(`[Scraper] Zara ürün kodu 8 haneli değil (${productCode.length} hane), alternatif pattern'ler deneniyor`);

    // Pattern 1: Direkt ürün kodu bazlı
    const widths = ['2048', '1920', '1024'];
    const seasons = ['800', '802', '804', '810'];
    const types = ['1', '2'];

    for (const width of widths) {
      for (const season of seasons) {
        for (const type of types) {
          // Format: /p/PRODUCT_CODE/w/WIDTH/...
          urls.push(`https://static.zara.net/photos///p/${productCode}/${season}/${type}/w/${width}/${productCode}_${season}_${type}_1_1.jpg`);

          // Format: /assets/PRODUCT_CODE/...
          urls.push(`https://static.zara.net/assets/public/photos/${productCode}/${season}/${type}/${productCode}_${season}_${type}_1_1.jpg?ts=${Date.now()}`);
        }
      }
    }
  }

  return urls;
}

/**
 * Zara için mobil site URL'sine çevir
 */
function convertToMobileUrl(url: string, domain: string): string {
  if (domain === 'zara.com') {
    // Desktop Zara'yı mobile'a çevir
    return url.replace('www.zara.com', 'm.zara.com');
  }
  return url;
}

/**
 * Gelişmiş tarayıcı başlıkları - anti-bot korumasını aşmak için
 */
function getEnhancedHeaders(url: string): Record<string, string> {
  return {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Cache-Control': 'max-age=0',
  };
}

/**
 * Gecikme fonksiyonu
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * URL'den ürün görselini çeker - retry mantığıyla
 */
async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  console.log(`[Scraper] fetchWithRetry başlıyor - URL: ${url}, max retries: ${retries}`);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`[Scraper] Fetch attempt ${attempt + 1}/${retries + 1}`);
      const startTime = Date.now();

      const response = await fetch(url, {
        headers: getEnhancedHeaders(url),
      });

      const fetchDuration = Date.now() - startTime;
      console.log(`[Scraper] Fetch tamamlandı - Süre: ${fetchDuration}ms, Status: ${response.status}`);

      // 403 hatası alırsak ve ilk deneme ise, biraz bekleyip tekrar dene
      if (response.status === 403 && attempt < retries) {
        console.log(`[Scraper] 403 Forbidden alındı, ${attempt + 1}. deneme bekleniyor...`);
        await sleep(1000 * (attempt + 1)); // 1s, 2s gecikme
        continue;
      }

      console.log(`[Scraper] fetchWithRetry başarılı - Status: ${response.status}`);
      return response;
    } catch (error) {
      console.error(`[Scraper] Fetch hatası (attempt ${attempt + 1}):`, error);
      if (attempt === retries) {
        console.error(`[Scraper] Tüm denemeler başarısız oldu`);
        throw error;
      }
      console.log(`[Scraper] ${attempt + 1}. deneme başarısız, ${500 * (attempt + 1)}ms bekleniyor...`);
      await sleep(500 * (attempt + 1));
    }
  }

  throw new Error('Maximum retry attempts reached');
}

/**
 * URL'den ürün görselini çeker
 */
export async function scrapeProductImage(url: string): Promise<ScrapeResult> {
  console.log(`\n========== [Scraper] scrapeProductImage BAŞLIYOR ==========`);
  console.log(`[Scraper] Input URL: ${url}`);

  if (!isValidUrl(url)) {
    console.error(`[Scraper] ❌ Geçersiz URL formatı`);
    return {
      success: false,
      images: [],
      productImage: null,
      error: 'Gecersiz URL',
    };
  }

  // Direkt görsel URL'si mi kontrol et
  if (/\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)) {
    console.log(`[Scraper] ✅ Direkt görsel URL'si tespit edildi: ${url}`);
    return {
      success: true,
      images: [{ url }],
      productImage: { url },
    };
  }

  const domain = extractDomain(url);
  console.log(`[Scraper] Domain çıkarıldı: ${domain}`);
  let currentUrl = url;

  // Zara için özel fallback: Ürün kodundan görsel URL'lerini oluştur
  const isZara = domain === 'zara.com';
  let zaraProductCode: string | null = null;
  if (isZara) {
    zaraProductCode = extractZaraProductCode(url);
    console.log(`[Scraper] Zara ürün kodu çıkarıldı: ${zaraProductCode}`);
  }

  // Zara için mobil URL'yi dene
  if (isZara) {
    currentUrl = convertToMobileUrl(url, domain);
    console.log(`[Scraper] Zara tespit edildi, mobil URL deneniyor: ${currentUrl}`);
  }

  try {
    // Sayfayı fetch et (retry mantığıyla)
    console.log(`[Scraper] Sayfa çekiliyor: ${currentUrl}`);
    const response = await fetchWithRetry(currentUrl);

    console.log(`[Scraper] Response status: ${response.status}`);

    if (!response.ok) {
      // 403 hatası - Zara için fallback dene
      if (response.status === 403 && isZara && zaraProductCode) {
        console.log(`[Scraper] 403 Forbidden - Zara için fallback deneniyor...`);

        // Ürün kodundan görsel URL'lerini oluştur
        const possibleUrls = generateZaraImageUrls(zaraProductCode);
        console.log(`[Scraper] ${possibleUrls.length} adet olası Zara görsel URL'si oluşturuldu`);

        // Her URL'yi HEAD request ile kontrol et
        for (const imageUrl of possibleUrls) {
          try {
            const imageResponse = await fetch(imageUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
              }
            });

            if (imageResponse.ok) {
              console.log(`[Scraper] Zara görseli bulundu: ${imageUrl}`);
              return {
                success: true,
                images: [{ url: imageUrl, alt: 'Zara Urun Gorseli' }],
                productImage: { url: imageUrl, alt: 'Zara Urun Gorseli' },
              };
            }
          } catch {
            // Bu URL çalışmadı, sonrakini dene
            continue;
          }
        }

        console.error(`[Scraper] Zara fallback başarısız - hiçbir görsel URL'si çalışmadı`);
      }

      // 403 hatası özel mesajı (Zara değilse veya fallback başarısızsa)
      if (response.status === 403) {
        console.error(`[Scraper] 403 Forbidden - Anti-bot koruması aktif`);

        // Domain'e göre özel mesaj
        const domainMessages: Record<string, string> = {
          'zara.com': 'Zara görseli engelliyor. Görsele sağ tıklayıp "Görsel Adresini Kopyala" yapın.',
          'bershka.com': 'Bershka görseli engelliyor. Görsele sağ tıklayıp "Görsel Adresini Kopyala" yapın.',
          'pullandbear.com': 'Pull&Bear görseli engelliyor. Görsele sağ tıklayıp "Görsel Adresini Kopyala" yapın.',
        };

        const errorMsg = domainMessages[domain] || 'Site erisimi engelledi. Görsele sağ tıklayıp "Görsel Adresini Kopyala" yapın.';

        return {
          success: false,
          images: [],
          productImage: null,
          error: errorMsg,
        };
      }

      return {
        success: false,
        images: [],
        productImage: null,
        error: `Sayfa yuklenemedi (${response.status})`,
      };
    }

    const html = await response.text();
    console.log(`[Scraper] ✅ HTML alındı - Uzunluk: ${html.length} karakter`);

    // HTML içeriğini debug için yazdır (ilk 500 karakter)
    console.log(`[Scraper] HTML önizleme (ilk 500 karakter):`);
    console.log(html.substring(0, 500));
    console.log('...');

    // OG:image kontrolü
    const ogImageCheck = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    console.log(`[Scraper] og:image kontrolü: ${ogImageCheck ? '✅ BULUNDU' : '❌ BULUNAMADI'}`);
    if (ogImageCheck) {
      console.log(`[Scraper] og:image URL: ${ogImageCheck[1]}`);
    }

    // Site-spesifik özel görsel çıkarma fonksiyonları
    console.log(`[Scraper] Site-spesifik görsel çıkarma başlıyor... (Domain: ${domain})`);
    let siteSpecificImage: ScrapedImage | null = null;

    switch (domain) {
      case 'trendyol.com':
        siteSpecificImage = extractTrendyolImage(html);
        break;
      case 'zara.com':
        siteSpecificImage = await extractZaraImage(html, currentUrl, zaraProductCode);
        break;
      case 'n11.com':
        siteSpecificImage = extractN11Image(html);
        break;
      case 'hepsiburada.com':
        siteSpecificImage = extractHepsiburadaImage(html);
        break;
      case 'lcwaikiki.com':
        siteSpecificImage = extractLCWaikikiImage(html);
        break;
      case 'koton.com':
        siteSpecificImage = extractKotonImage(html);
        break;
      case 'defacto.com.tr':
        siteSpecificImage = extractDefactoImage(html);
        break;
      case 'mango.com':
        siteSpecificImage = extractMangoImage(html);
        break;
      case 'boyner.com.tr':
        siteSpecificImage = extractBoynerImage(html);
        break;
      case 'bershka.com':
        siteSpecificImage = await extractBershkaImage(html, currentUrl);
        break;
    }

    // Site-spesifik fonksiyon başarılı olduysa direkt dön
    if (siteSpecificImage) {
      console.log(`[Scraper] ✅ ${domain} görseli başarıyla çıkarıldı!`);
      console.log(`[Scraper] Görsel URL: ${siteSpecificImage.url}`);
      console.log(`========== [Scraper] BAŞARILI - TAMAMLANDI ==========\n`);
      return {
        success: true,
        images: [siteSpecificImage],
        productImage: siteSpecificImage,
      };
    }

    // Özel fonksiyon başarısız olduysa genel scraping'e geç
    console.log(`[Scraper] ⚠️ ${domain} özel fonksiyonu görsel bulamadı, genel scraping deneniyor...`);

    // Diğer siteler için genel scraping
    const images = extractImagesFromHtml(html, currentUrl, domain);
    console.log(`[Scraper] Genel scraping tamamlandı - Toplam görsel: ${images.length}`);

    if (images.length > 0) {
      console.log(`[Scraper] İlk 3 görsel URL'si:`);
      images.slice(0, 3).forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.url.substring(0, 100)}...`);
      });
    }

    // Duplicate'ları kaldır (normalize edilmiş URL'lere göre)
    const seenNormalized = new Set<string>();
    const uniqueImages = images.filter(img => {
      const normalized = normalizeImageUrl(img.url);
      if (seenNormalized.has(normalized)) {
        return false;
      }
      seenNormalized.add(normalized);
      return true;
    });

    console.log(`[Scraper] Tekil görsel sayısı: ${uniqueImages.length}`);

    if (uniqueImages.length === 0) {
      console.error(`[Scraper] ❌ Hiç görsel bulunamadı!`);
      console.log(`========== [Scraper] BAŞARISIZ - TAMAMLANDI ==========\n`);
      return {
        success: false,
        images: [],
        productImage: null,
        error: 'Sayfada urun gorseli bulunamadi',
      };
    }

    // İlk görsel genellikle ana ürün görseli
    console.log(`[Scraper] ✅ Ana ürün görseli seçildi: ${uniqueImages[0].url.substring(0, 100)}...`);
    console.log(`========== [Scraper] BAŞARILI - TAMAMLANDI ==========\n`);
    return {
      success: true,
      images: uniqueImages,
      productImage: uniqueImages[0],
    };
  } catch (error) {
    console.error(`[Scraper] ❌ HATA OLUŞTU:`, error);
    console.error(`[Scraper] Hata türü: ${error instanceof Error ? error.constructor.name : typeof error}`);
    console.error(`[Scraper] Hata mesajı: ${error instanceof Error ? error.message : String(error)}`);

    // Zara için fallback dene (catch bloğunda)
    if (isZara && zaraProductCode) {
      console.log(`[Scraper] ⚠️ Fetch hatası, Zara fallback deneniyor...`);

      try {
        const possibleUrls = generateZaraImageUrls(zaraProductCode);
        console.log(`[Scraper] ${possibleUrls.length} adet olası Zara görsel URL'si oluşturuldu`);

        // Her URL'yi HEAD request ile kontrol et
        for (const imageUrl of possibleUrls) {
          try {
            const imageResponse = await fetch(imageUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
              }
            });

            if (imageResponse.ok) {
              console.log(`[Scraper] Zara görseli bulundu (catch fallback): ${imageUrl}`);
              return {
                success: true,
                images: [{ url: imageUrl, alt: 'Zara Urun Gorseli' }],
                productImage: { url: imageUrl, alt: 'Zara Urun Gorseli' },
              };
            }
          } catch {
            // Bu URL çalışmadı, sonrakini dene
            continue;
          }
        }

        console.error(`[Scraper] Zara fallback başarısız (catch bloğu)`);
      } catch (fallbackError) {
        console.error(`[Scraper] Zara fallback hatası:`, fallbackError);
      }
    }

    console.log(`========== [Scraper] BAŞARISIZ - TAMAMLANDI ==========\n`);
    return {
      success: false,
      images: [],
      productImage: null,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    };
  }
}

/**
 * Görsel URL'sinin geçerli ve erişilebilir olup olmadığını kontrol eder
 */
export async function validateImageUrl(imageUrl: string): Promise<boolean> {
  console.log(`[Scraper] validateImageUrl başlıyor: ${imageUrl.substring(0, 100)}...`);

  try {
    const startTime = Date.now();
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      },
    });

    const duration = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    const isValid = response.ok && contentType.startsWith('image/');

    console.log(`[Scraper] validateImageUrl sonuç: ${isValid ? '✅ GEÇERLİ' : '❌ GEÇERSİZ'} (${duration}ms)`);
    console.log(`[Scraper] Status: ${response.status}, Content-Type: ${contentType}`);

    return isValid;
  } catch (error) {
    console.error(`[Scraper] validateImageUrl hatası:`, error);
    return false;
  }
}

export default {
  scrapeProductImage,
  validateImageUrl,
  isValidUrl,
  extractDomain,
};
