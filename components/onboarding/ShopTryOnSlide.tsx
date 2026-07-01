// ShopTryOnSlide - Mağazadan Ürün Deneme Demo Bileşeni
// URL ile mağaza ürününü getirip model üzerinde deneme simülasyonu

import { BorderRadius, Colors, Shadows, Spacing, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dimensions, Image, ImageSourcePropType, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Demo fazları
export type ShopTryOnPhase =
  | 'initial'           // Başlangıç
  | 'url_input'         // URL giriliyor
  | 'loading_shop'      // Mağaza yükleniyor
  | 'show_products'     // Ürünler gösteriliyor
  | 'select_product'    // Ürün seçiliyor
  | 'load_model'        // Model yükleniyor
  | 'merging'           // Birleştirme
  | 'complete';         // Tamamlandı

// Timing konfigürasyonu (ms) - Optimize edilmiş dengeli hızlar
const PHASE_TIMING = {
  initial: 400,
  url_input: 2800,       // .com yazılana kadar bekle (15 karakter x 150ms + bekleme)
  loading_shop: 1000,    // Yükleme biraz daha uzun
  show_products: 900,    // Ürünleri görmek için yeterli süre
  select_product: 900,   // Seçim için yeterli süre
  load_model: 800,       // Model yükleme
  merging: 900,          // Birleşme daha yumuşak
};

interface ProductItem {
  id: number;
  image: ImageSourcePropType;
  size: string;
}

interface ShopTryOnSlideProps {
  onPhaseChange?: (phase: ShopTryOnPhase) => void;
  autoStart?: boolean;
  skipToComplete?: boolean;
  products: ImageSourcePropType[];
  modelImages: ImageSourcePropType[];
  resultImage: ImageSourcePropType;
}

export function ShopTryOnSlide({
  onPhaseChange,
  autoStart = true,
  skipToComplete = false,
  products,
  modelImages,
  resultImage,
}: ShopTryOnSlideProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<ShopTryOnPhase>('initial');
  const [urlText, setUrlText] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);

  // Animasyon değerleri
  const urlContainerOpacity = useSharedValue(0);
  const urlContainerScale = useSharedValue(0.9);

  const loadingOpacity = useSharedValue(0);
  const loadingProgress = useSharedValue(0);

  const productsContainerOpacity = useSharedValue(0);
  const productsContainerTranslateY = useSharedValue(50);

  const modelOpacity = useSharedValue(0);
  const modelScale = useSharedValue(0.8);

  const productImageOpacity = useSharedValue(0);
  const productImageScale = useSharedValue(0.7);

  const resultOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  // Faz değişikliğini bildir
  const handlePhaseChange = useCallback((newPhase: ShopTryOnPhase) => {
    setPhase(newPhase);
    onPhaseChange?.(newPhase);
  }, [onPhaseChange]);

  // URL typing animasyonu - Yavaş yazım + enter efekti
  const typeUrl = useCallback(() => {
    const url = 'shopcostume.com';
    let index = 0;
    const interval = setInterval(() => {
      if (index <= url.length) {
        setUrlText(url.substring(0, index));
        index++;
      } else {
        clearInterval(interval);
        // URL yazımı bittiğinde enter efekti (kısa bir titreme)
        setTimeout(() => {
          urlContainerScale.value = withSequence(
            withTiming(0.98, { duration: 100 }),
            withTiming(1, { duration: 100 })
          );
        }, 100);
      }
    }, 150); // Daha yavaş, okunabilir yazım (120'den 150'ye)
    return () => clearInterval(interval);
  }, []);

  // Ürünleri oluştur
  const productItems: ProductItem[] = products.map((img, idx) => ({
    id: idx,
    image: img,
    size: ['S', 'M', 'L'][idx] || 'M',
  }));

  // Animasyon sekansını başlat
  useEffect(() => {
    if (!autoStart) return;

    const timeouts: number[] = [];

    // FAZ 1: URL input göster
    const t1 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('url_input');

      urlContainerOpacity.value = withTiming(1, { duration: 400 });
      urlContainerScale.value = withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.back(1.1))
      });

      // URL typing başlat
      typeUrl();
    }, PHASE_TIMING.initial);
    timeouts.push(t1);

    // FAZ 2: Mağaza yükleniyor
    const t2 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('loading_shop');

      urlContainerOpacity.value = withTiming(0, { duration: 400 });
      loadingOpacity.value = withTiming(1, { duration: 300 });
      // Progress bar animasyonu - 0'dan 100'e
      loadingProgress.value = withTiming(1, {
        duration: PHASE_TIMING.loading_shop,
        easing: Easing.out(Easing.cubic)
      });
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input);
    timeouts.push(t2);

    // FAZ 3: Ürünleri göster
    const t3 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('show_products');

      loadingOpacity.value = withTiming(0, { duration: 300 });
      productsContainerOpacity.value = withTiming(1, { duration: 500 });
      productsContainerTranslateY.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.cubic)
      });
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input + PHASE_TIMING.loading_shop);
    timeouts.push(t3);

    // FAZ 4: Ürün seç
    const t4 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('select_product');
      runOnJS(setSelectedProduct)(1); // İkinci ürünü seç (b.webp)

      productsContainerOpacity.value = withTiming(0, { duration: 400 });
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input + PHASE_TIMING.loading_shop + PHASE_TIMING.show_products);
    timeouts.push(t4);

    // FAZ 5: Model yükle
    const t5 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('load_model');

      modelOpacity.value = withTiming(1, { duration: PHASE_TIMING.load_model });
      modelScale.value = withTiming(1, {
        duration: PHASE_TIMING.load_model,
        easing: Easing.out(Easing.back(1.1))
      });

      productImageOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      productImageScale.value = withDelay(200, withTiming(1, {
        duration: 400,
        easing: Easing.out(Easing.cubic)
      }));

      glowOpacity.value = withTiming(0.8, { duration: 400 });
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input + PHASE_TIMING.loading_shop + PHASE_TIMING.show_products + PHASE_TIMING.select_product);
    timeouts.push(t5);

    // FAZ 6: Birleştirme
    const t6 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('merging');

      modelOpacity.value = withTiming(0, { duration: 400 });
      productImageOpacity.value = withTiming(0, { duration: 400 });

      resultOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input + PHASE_TIMING.loading_shop + PHASE_TIMING.show_products + PHASE_TIMING.select_product + PHASE_TIMING.load_model);
    timeouts.push(t6);

    // FAZ 7: Tamamlandı
    const t7 = window.setTimeout(() => {
      runOnJS(handlePhaseChange)('complete');
      glowOpacity.value = withTiming(0.4, { duration: 300 });
    }, PHASE_TIMING.initial + PHASE_TIMING.url_input + PHASE_TIMING.loading_shop + PHASE_TIMING.show_products + PHASE_TIMING.select_product + PHASE_TIMING.load_model + PHASE_TIMING.merging);
    timeouts.push(t7);

    return () => {
      timeouts.forEach(t => window.clearTimeout(t));
    };
  }, [autoStart]);

  // skipToComplete değiştiğinde animasyonu atla
  useEffect(() => {
    if (skipToComplete && phase !== 'complete') {
      urlContainerOpacity.value = withTiming(0, { duration: 200 });
      loadingOpacity.value = withTiming(0, { duration: 200 });
      productsContainerOpacity.value = withTiming(0, { duration: 200 });
      modelOpacity.value = withTiming(0, { duration: 200 });
      productImageOpacity.value = withTiming(0, { duration: 200 });
      resultOpacity.value = withTiming(1, { duration: 200 });
      glowOpacity.value = withTiming(0.4, { duration: 200 });

      setUrlText('shopcostume.com');
      setSelectedProduct(1);
      setPhase('complete');
      onPhaseChange?.('complete');
    }
  }, [skipToComplete]);

  // Animasyonlu stiller
  const urlContainerStyle = useAnimatedStyle(() => ({
    opacity: urlContainerOpacity.value,
    transform: [{ scale: urlContainerScale.value }],
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    opacity: loadingOpacity.value,
  }));

  const productsContainerStyle = useAnimatedStyle(() => ({
    opacity: productsContainerOpacity.value,
    transform: [{ translateY: productsContainerTranslateY.value }],
  }));

  const modelStyle = useAnimatedStyle(() => ({
    opacity: modelOpacity.value,
    transform: [{ scale: modelScale.value }],
  }));

  const productImageStyle = useAnimatedStyle(() => ({
    opacity: productImageOpacity.value,
    transform: [{ scale: productImageScale.value }],
  }));

  const resultStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const loadingProgressStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value * 100}%`,
  }));

  // Görsel boyutları
  const IMAGE_WIDTH = wp('50%');
  const IMAGE_HEIGHT = IMAGE_WIDTH * 1.33;

  const PRODUCT_SIZE = wp('20%');

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('onboarding.shopTryOn.title')}</Text>
        <Text style={styles.subtitle}>{t('onboarding.shopTryOn.subtitle')}</Text>
      </View>

      <View style={styles.contentSection}>
        <Animated.View style={[styles.urlContainer, urlContainerStyle]}>
          <View style={styles.urlInputCard}>
            <Ionicons name="link-outline" size={20} color={Colors.accent.primary} style={styles.urlIcon} />
            <TextInput
              style={styles.urlInput}
              value={urlText}
              editable={false}
              placeholder="Mağaza URL'sini girin..."
              placeholderTextColor={Colors.text.muted}
            />
          </View>
        </Animated.View>

        <Animated.View style={[styles.loadingContainer, loadingStyle]}>
          <View style={styles.loadingSpinner} />
          <Text style={styles.loadingText}>Mağaza ürünleri yükleniyor...</Text>
          <View style={styles.progressBarContainer}>
            <Animated.View style={[styles.progressBarFill, loadingProgressStyle]} />
          </View>
        </Animated.View>

        <Animated.View style={[styles.productsContainer, productsContainerStyle]}>
          <Text style={styles.productsTitle}>Ürünleri Seçin</Text>
          <View style={styles.productsGrid}>
            {productItems.map((product) => (
              <Animated.View
                key={product.id}
                entering={FadeIn.delay(product.id * 150)}
                style={[
                  styles.productCard,
                  selectedProduct === product.id && styles.productCardSelected
                ]}
              >
                <Image
                  source={product.image}
                  style={styles.productImage}
                  resizeMode="contain"
                />
                <View style={styles.sizeTag}>
                  <Text style={styles.sizeText}>{product.size}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {(phase === 'load_model' || phase === 'merging' || phase === 'complete') && (
          <View style={styles.mergeSection}>
            <Animated.View style={[styles.glow, glowStyle, { width: IMAGE_WIDTH + 40, height: IMAGE_HEIGHT + 40 }]} />

            <Animated.View style={[styles.modelContainer, modelStyle, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
              <Image
                source={modelImages[0]}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>

            {selectedProduct !== null && (
              <Animated.View style={[styles.floatingProduct, productImageStyle]}>
                <View style={styles.floatingProductCard}>
                  <Image
                    source={productItems[selectedProduct].image}
                    style={styles.floatingProductImage}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>
            )}

            <Animated.View style={[styles.resultContainer, resultStyle, { width: IMAGE_WIDTH, height: IMAGE_HEIGHT }]}>
              <Image
                source={resultImage}
                style={styles.image}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        )}

        {phase === 'complete' && (
          <Animated.View
            entering={FadeInUp.delay(300)}
            style={styles.completeMessage}
          >
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={20} color={Colors.text.white} />
            </View>
            <Text style={styles.completeText}>{t('onboarding.shopTryOn.success')}</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    fontSize: 26,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    maxWidth: '95%',
    fontSize: 14,
  },
  contentSection: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // URL Input
  urlContainer: {
    position: 'absolute',
    width: '90%',
  },
  urlInputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs, // Daha da azaltıldı
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
    minHeight: 48, // Sabit yükseklik
  },
  urlIcon: {
    marginRight: Spacing.sm,
    marginTop: -2, // İkonu biraz aşağı al
  },
  urlInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 10,
    includeFontPadding: false,
    textAlignVertical: 'top',
  },

  // Loading
  loadingContainer: {
    position: 'absolute',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.accent.primarySoft,
    borderTopColor: Colors.accent.primary,
    marginBottom: Spacing.md,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },

  // Ürünler
  productsContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: '100%',
  },
  productsTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  productCard: {
    width: wp('22%'),
    height: wp('28%'),
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.sm,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  productCardSelected: {
    borderColor: Colors.accent.primary,
    ...Shadows.md,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  sizeTag: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  sizeText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 10,
  },

  // Merge section
  mergeSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  glow: {
    position: 'absolute',
    backgroundColor: Colors.accent.primarySoft,
    borderRadius: wp('8%'),
    ...Shadows.glow,
  },
  modelContainer: {
    position: 'absolute',
    borderRadius: wp('6%'),
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  floatingProduct: {
    position: 'absolute',
    top: wp('8%'),
    alignSelf: 'center',
  },
  floatingProductCard: {
    width: wp('28%'),
    height: wp('35%'),
    backgroundColor: Colors.card.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    ...Shadows.lg,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  floatingProductImage: {
    width: '100%',
    height: '100%',
  },
  resultContainer: {
    position: 'absolute',
    borderRadius: wp('6%'),
    backgroundColor: Colors.background.secondary,
    overflow: 'hidden',
  },

  // Complete message
  completeMessage: {
    position: 'absolute',
    bottom: hp('8%'),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.success.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  completeText: {
    ...Typography.body,
    color: Colors.success.main,
    fontWeight: '600',
    fontSize: 13,
  },

  // Progress bar
  progressBarContainer: {
    width: wp('60%'),
    height: 6,
    backgroundColor: Colors.accent.primarySoft,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
  },
});
