// Analyzing Screen - AI Analiz süreci animasyon ekranı
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { SafeContainer } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { AnalysisProgressBar } from '@/components/onboarding/AnalysisProgressBar';
import { AnalysisResultModal } from '@/components/onboarding/AnalysisResultModal';
import { RadarScanAnimation } from '@/components/onboarding/RadarScanAnimation';
import { LinearGradient } from 'expo-linear-gradient';
import { useAnalysis } from '@/hooks/useAnalysis';
import { useAuthContext } from '@/contexts';
import { useReferral } from '@/contexts/ReferralContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { i18n } from '@/i18n';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type AnalysisPhase = 'entering' | 'framing' | 'scanning' | 'revealing' | 'complete';

export default function AnalyzingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string;
  const purposes = params.purposes ? JSON.parse(params.purposes as string) : ['general'];
  const { user, deviceId, userPreferences, isLoading: authLoading, isPremium } = useAuthContext();
  const { startAnalysis, isAnalyzing, error } = useAnalysis();
  const { trackAnalysis } = useReferral();
  const { t } = useTranslation();

  const [phase, setPhase] = useState<AnalysisPhase>('entering');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Çoklu analiz çağrılarını engelle
  const hasStartedAnalysis = useRef(false);
  const analysisImageUri = useRef<string | null>(null);

  // Animasyon değerleri
  const screenOpacity = useSharedValue(0);
  const imageScale = useSharedValue(0.6);
  const imageTranslateY = useSharedValue(100);
  const imageOpacity = useSharedValue(0);
  const frameBorderRadius = useSharedValue(wp('3%'));
  const frameBorderWidth = useSharedValue(0);
  const frameBorderOpacity = useSharedValue(0);
  const frameGlowOpacity = useSharedValue(0);
  const blurOpacity = useSharedValue(0);
  const statusTextOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(1);
  const titleTranslateY = useSharedValue(0);

  // Gerçek analizi başlat
  useEffect(() => {
    const performAnalysis = async () => {
      if (!imageUri) {
        router.back();
        return;
      }

      // Auth yüklenene kadar bekle
      if (authLoading) {
        console.log('[Analyzing] Waiting for authentication to complete...');
        return;
      }

      // Kullanıcı authenticated olmadan devam etme
      if (!user) {
        console.warn('[Analyzing] User not authenticated, cannot start analysis');
        Alert.alert(
          t('analysis.analyzing.error.title'),
          t('analysis.analyzing.error.authWait')
        );
        return;
      }

      // Aynı görsel için zaten analiz başlatıldıysa, tekrar başlatma
      if (hasStartedAnalysis.current && analysisImageUri.current === imageUri) {
        console.log('[Analyzing] Analysis already started for this image, skipping duplicate call');
        return;
      }

      // Analiz durumunu işaretle
      hasStartedAnalysis.current = true;
      analysisImageUri.current = imageUri;
      console.log('[Analyzing] Starting analysis (first call only)');

      const result = await startAnalysis(imageUri, {
        userId: user.uid,
        deviceId: deviceId ?? undefined,
        language: (i18n.language === 'tr' || i18n.language === 'en') ? i18n.language as 'tr' | 'en' : 'tr',
        userPreferences: userPreferences || undefined,
        purposes: purposes, // Analiz amaçlarını gönder
      });

      if (result) {
        // imageUri'yi result içine ekle
        const resultWithImage = {
          ...result,
          imageUri: imageUri,
        };
        setAnalysisResult(resultWithImage);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Track analysis completion for referral system
        try {
          const analysisType = purposes.join(',') || 'outfit_analysis';
          await trackAnalysis(analysisType);
          console.log('[Analyzing] ✅ Analysis tracked successfully');
        } catch (trackError) {
          console.warn('[Analyzing] Failed to track analysis:', trackError);
          // Don't throw - analysis was successful, tracking is secondary
        }
      } else if (error) {
        Alert.alert(t('analysis.analyzing.error.title'), error);
        // Reset flag on error so user can retry
        hasStartedAnalysis.current = false;
        analysisImageUri.current = null;
        router.back();
      }
    };

    performAnalysis();
  }, [imageUri, authLoading, user]);

  // Animasyon sekansı
  useEffect(() => {
    // Ekran fade in
    screenOpacity.value = withTiming(1, { duration: 300 });

    // FAZ 1: Görsel giriş animasyonu
    setTimeout(() => {
      setPhase('entering');

      imageOpacity.value = withTiming(1, { duration: 400 });
      imageTranslateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
      imageScale.value = withSpring(1, {
        damping: 12,
        stiffness: 120,
      });
    }, 200);

    // FAZ 2: Çerçeveleme (mavi border)
    setTimeout(() => {
      setPhase('framing');

      imageScale.value = withTiming(0.85, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      frameBorderRadius.value = withTiming(wp('8%'), { duration: 600 });
      frameBorderWidth.value = withTiming(3, { duration: 300 });
      frameBorderOpacity.value = withTiming(1, { duration: 300 });
      frameGlowOpacity.value = withTiming(0.6, { duration: 400 });
    }, 800);

    // FAZ 3: Tarama (Radar + Progress Bar)
    setTimeout(() => {
      setPhase('scanning');

      blurOpacity.value = withTiming(0.15, { duration: 300 });
      statusTextOpacity.value = withTiming(1, { duration: 200 });

      // Hafif nabız efekti - analiz bitene kadar devam et
      const pulseAnimation = () => {
        imageScale.value = withSequence(
          withTiming(0.88, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 800, easing: Easing.inOut(Easing.ease) })
        );
      };
      pulseAnimation();
    }, 1400);
  }, []);

  // Analiz tamamlandığında sonuç göster ve result ekranına geç
  useEffect(() => {
    if (analysisResult && phase === 'scanning') {
      // FAZ 4: Sonuçlar - Görseli yukarı kaydır
      setTimeout(() => {
        setPhase('revealing');

        blurOpacity.value = withTiming(0, { duration: 300 });
        statusTextOpacity.value = withTiming(0, { duration: 200 });

        // Görseli yukarı kaydır (modalın gösterilebilmesi için)
        imageTranslateY.value = withSpring(-hp('8%'), {
          damping: 15,
          stiffness: 100,
        });

        // Başlığı da yukarı kaydır ve fade out
        titleTranslateY.value = withSpring(-hp('5%'), {
          damping: 15,
          stiffness: 100,
        });
        titleOpacity.value = withTiming(0.3, { duration: 300 });
      }, 500);

      // FAZ 5: Tamamlandı - sonuç ekranına git
      setTimeout(() => {
        setPhase('complete');

        // Result ekranına geç veya paywall'a yönlendir
        setTimeout(() => {
          // Premium değilse direkt paywall'a yönlendir
          if (!isPremium) {
            console.log('[Analyzing] Redirecting to paywall (non-premium user)');
            router.replace('/paywall');
            return;
          }

          // Premium ise result ekranına git
          console.log('[Analyzing] Navigating to result with data:', {
            hasImageUri: !!analysisResult.imageUri,
            imageUri: analysisResult.imageUri?.substring(0, 50),
          });
          router.replace({
            pathname: '/analysis-result',
            params: {
              analysis: JSON.stringify(analysisResult),
            },
          });
        }, 2000); // Modal gösterildikten 2 saniye sonra
      }, 1000);
    }
  }, [analysisResult, phase, imageUri, router, isPremium]);

  // Animasyonlu stiller
  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const imageContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: imageTranslateY.value },
      { scale: imageScale.value },
    ],
    opacity: imageOpacity.value,
    borderRadius: frameBorderRadius.value,
  }));

  const frameBorderStyle = useAnimatedStyle(() => ({
    borderWidth: frameBorderWidth.value,
    opacity: frameBorderOpacity.value,
    borderRadius: frameBorderRadius.value,
    transform: [
      { translateY: imageTranslateY.value },
      { scale: imageScale.value },
    ],
  }));

  const frameGlowStyle = useAnimatedStyle(() => ({
    opacity: frameGlowOpacity.value,
    borderRadius: frameBorderRadius.value,
    transform: [
      { translateY: imageTranslateY.value },
      { scale: imageScale.value },
    ],
  }));

  const blurOverlayStyle = useAnimatedStyle(() => ({
    opacity: blurOpacity.value,
  }));

  const statusTextStyle = useAnimatedStyle(() => ({
    opacity: statusTextOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  // Görsel boyutları
  const IMAGE_WIDTH = wp('70%');
  const IMAGE_HEIGHT = IMAGE_WIDTH * 1.33;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9FF' }}>
      <LinearGradient
        colors={['#F8F9FF', '#FFFFFF', '#F8F9FF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <SafeContainer edges={['bottom']} withGradient={false}>
        <Animated.View style={[styles.container, screenStyle]}>

        {/* Geri Butonu */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.text.primary} />
        </TouchableOpacity>

        {/* Başlık */}
        <Animated.View style={[styles.titleContainer, titleStyle]}>
          <Text style={styles.title}>{t('analysis.analyzing.title')}</Text>
          <Text style={styles.subtitle}>{t('analysis.analyzing.subtitle')}</Text>
        </Animated.View>

        {/* Ana görsel alanı */}
        <View style={styles.imageSection}>
          <View style={styles.imageSectionInner}>
            {/* Glow efekti */}
            <Animated.View
              style={[
                styles.frameGlow,
                frameGlowStyle,
                { width: IMAGE_WIDTH + 20, height: IMAGE_HEIGHT + 20 },
              ]}
            />

            {/* Mavi çerçeve */}
            <Animated.View
              style={[
                styles.frameBorder,
                frameBorderStyle,
                { width: IMAGE_WIDTH + 8, height: IMAGE_HEIGHT + 8 },
              ]}
            />

            {/* Görsel container */}
            <Animated.View
              style={[
                styles.imageContainer,
                imageContainerStyle,
                { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
              ]}
            >
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode="cover"
              />

              {/* Blur overlay */}
              <Animated.View style={[styles.blurOverlay, blurOverlayStyle]} />

              {/* Radar scan efekti */}
              <RadarScanAnimation
                isActive={phase === 'scanning'}
                width={IMAGE_WIDTH}
                height={IMAGE_HEIGHT}
              />
            </Animated.View>

            {/* AI Sonuç Modalı */}
            {analysisResult && (
              <AnalysisResultModal
                visible={phase === 'complete' || phase === 'revealing'}
                results={[
                  {
                    icon: '🎨',
                    label: t('analysis.analyzing.modal.colorHarmony'),
                    value: Math.round(analysisResult.colorHarmony?.score * 10) || 0,
                  },
                  {
                    icon: '✨',
                    label: t('analysis.analyzing.modal.styleScore'),
                    value: Math.round(analysisResult.styleMatch?.score * 10) || 0,
                  },
                  {
                    icon: '⭐',
                    label: t('analysis.analyzing.modal.overallScore'),
                    value: Math.round(analysisResult.overallScore * 10) || 0,
                  },
                  {
                    icon: '👔',
                    label: t('analysis.analyzing.modal.style'),
                    value: analysisResult.styleMatch?.detectedStyle || t('analysis.analyzing.modal.unknown'),
                  },
                ]}
                delay={100}
              />
            )}
          </View>

          {/* Analiz durumu metni ve progress bar - Fotoğrafın altında */}
          <Animated.View style={[styles.statusContainer, statusTextStyle]}>
            <View style={styles.statusContent}>
              <View style={styles.statusHeader}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>{t('analysis.analyzing.statusText')}</Text>
              </View>
              <AnalysisProgressBar
                isActive={phase === 'scanning'}
                width={IMAGE_WIDTH * 0.8}
              />
            </View>
          </Animated.View>
        </View>
        </Animated.View>
      </SafeContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: hp('8%'),
  },
  backButton: {
    position: 'absolute',
    top: hp('6%'),
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    zIndex: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: hp('4%'),
  },
  title: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingBottom: hp('8%'), // Safe area için bottom padding
  },
  imageSectionInner: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  frameGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    ...Shadows.glow,
  },
  frameBorder: {
    position: 'absolute',
    borderColor: '#6366F1',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: Colors.background.secondary,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#6366F1',
  },
  statusContainer: {
    marginTop: hp('3%'),
    backgroundColor: Colors.card.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.md,
    alignSelf: 'center',
  },
  statusContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginRight: Spacing.sm,
  },
  statusText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
