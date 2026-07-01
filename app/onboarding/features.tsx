// Features Screen - Feature introduction screen

import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, FlatList, ViewToken, ImageSourcePropType } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { SafeContainer, Button } from '@/components/ui';
import { OnboardingProgress, FeatureSlide, AnalysisDemoSlide, OutfitTransferSlide, ShopTryOnSlide } from '@/components/onboarding';
import { useOnboardingContext } from '@/contexts';
import { Colors, Spacing } from '@/constants/theme';
import type { SlideMode, DemoResult } from '@/components/onboarding/AnalysisDemoSlide';
import type { TransferPhase } from '@/components/onboarding/OutfitTransferSlide';
import type { ShopTryOnPhase } from '@/components/onboarding/ShopTryOnSlide';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FeatureData {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon?: string;
  color?: string;
  isDemo?: boolean;
  slideType?: 'analysis' | 'outfit-transfer' | 'shop-tryon';
  // Demo slide için
  mode?: SlideMode;
  modelImage?: ImageSourcePropType;
  clothesImage?: ImageSourcePropType;
  resultModelImage?: ImageSourcePropType;
  results?: DemoResult[];
  // OutfitTransferSlide için
  outfitImage?: ImageSourcePropType;
  // ShopTryOnSlide için
  products?: ImageSourcePropType[];
  modelImages?: ImageSourcePropType[];
}

// Different results for each slide
const SLIDE_1_RESULTS: DemoResult[] = [
  { label: 'onboarding.demo.colorHarmony', value: 92, position: 'top-left' },
  { label: 'onboarding.demo.style', value: 88, position: 'top-right' },
  { label: 'onboarding.demo.season', value: 95, position: 'bottom-left' },
  { label: 'onboarding.demo.daily', value: null, position: 'bottom-right', isTag: true },
];

const SLIDE_2_RESULTS: DemoResult[] = [
  { label: 'onboarding.demo.comfort', value: 96, position: 'top-left' },
  { label: 'onboarding.demo.color', value: 90, position: 'top-right' },
  { label: 'onboarding.demo.quality', value: 85, position: 'bottom-left' },
  { label: 'onboarding.demo.homeStyle', value: null, position: 'bottom-right', isTag: true },
];

const FEATURES: FeatureData[] = [
  {
    id: 'analysis-1',
    titleKey: 'onboarding.features.analysis.title',
    subtitleKey: 'onboarding.features.analysis.subtitle',
    isDemo: true,
    slideType: 'analysis',
    mode: 'single',
    modelImage: require('@/assets/images/Onboarding-Assets/Model/a.webp'),
    results: SLIDE_1_RESULTS,
  },
  {
    id: 'outfit-transfer',
    titleKey: 'onboarding.outfitTransfer.title',
    subtitleKey: 'onboarding.outfitTransfer.subtitle',
    isDemo: true,
    slideType: 'outfit-transfer',
    modelImage: require('@/assets/images/Onboarding-Assets/Model/a.webp'),
    outfitImage: require('@/assets/images/Onboarding-Assets/Clothes/a.webp'),
    resultModelImage: require('@/assets/images/Onboarding-Assets/Model/b.webp'),
  },
  {
    id: 'shop-tryon',
    titleKey: 'onboarding.shopTryOn.title',
    subtitleKey: 'onboarding.shopTryOn.subtitle',
    isDemo: true,
    slideType: 'shop-tryon',
    products: [
      require('@/assets/images/Onboarding-Assets/Clothes/a.webp'),
      require('@/assets/images/Onboarding-Assets/Clothes/b.webp'),
      require('@/assets/images/Onboarding-Assets/Clothes/c.webp'),
    ],
    modelImages: [
      require('@/assets/images/Onboarding-Assets/Model/a.webp'), // Initial model
    ],
    resultModelImage: require('@/assets/images/Onboarding-Assets/Model/c.webp'), // Model a→c transformation with outfit b.webp
  },
];

export default function FeaturesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { currentStepIndex, totalSteps, nextStep, skipOnboarding } = useOnboardingContext();
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedSlides, setCompletedSlides] = useState<Set<number>>(new Set());
  const [skipToCompleteIndex, setSkipToCompleteIndex] = useState<number | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // When animation phase changes
  const handlePhaseChange = useCallback((phase: string, slideIndex: number) => {
    if (phase === 'complete') {
      setCompletedSlides(prev => new Set([...prev, slideIndex]));
    }
  }, []);

  // Go to next page (style preferences)
  const goToNextPage = useCallback(() => {
    nextStep();
    router.push('/onboarding/questions');
  }, [nextStep, router]);

  const handleContinue = () => {
    if (activeIndex < FEATURES.length - 1) {
      // Go to next slide
      // If current slide not completed, complete it and then proceed
      if (!completedSlides.has(activeIndex)) {
        setSkipToCompleteIndex(activeIndex);
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: activeIndex + 1,
            animated: true,
          });
          setSkipToCompleteIndex(null);
        }, 300);
      } else {
        flatListRef.current?.scrollToIndex({
          index: activeIndex + 1,
          animated: true,
        });
      }
    } else {
      // Last slide - go to next page
      if (completedSlides.has(activeIndex)) {
        goToNextPage();
      } else {
        setSkipToCompleteIndex(activeIndex);
        setTimeout(() => {
          goToNextPage();
        }, 500);
      }
    }
  };

  const handleSkip = async () => {
    await skipOnboarding();
    router.replace('/(tabs)');
  };

  const isLastFeature = activeIndex === FEATURES.length - 1;

  return (
    <SafeContainer edges={['top', 'bottom']}>
      {/* Progress */}
      <OnboardingProgress currentStep={currentStepIndex + 1 + activeIndex} totalSteps={totalSteps} />

      {/* Feature Slides */}
      <FlatList
        ref={flatListRef}
        data={FEATURES}
        renderItem={({ item, index }) => (
          <View style={{ width: SCREEN_WIDTH }}>
            {item.isDemo ? (
              <>
                {item.slideType === 'analysis' && (
                  <AnalysisDemoSlide
                    autoStart={activeIndex === index}
                    onPhaseChange={(phase) => handlePhaseChange(phase, index)}
                    skipToComplete={skipToCompleteIndex === index}
                    mode={item.mode}
                    modelImage={item.modelImage}
                    clothesImage={item.clothesImage}
                    resultModelImage={item.resultModelImage}
                    results={item.results}
                    titleKey={item.titleKey}
                    subtitleKey={item.subtitleKey}
                  />
                )}
                {item.slideType === 'outfit-transfer' && (
                  <OutfitTransferSlide
                    autoStart={activeIndex === index}
                    onPhaseChange={(phase) => handlePhaseChange(phase as any, index)}
                    skipToComplete={skipToCompleteIndex === index}
                    modelImage={item.modelImage!}
                    outfitImage={item.outfitImage!}
                    resultImage={item.resultModelImage!}
                  />
                )}
                {item.slideType === 'shop-tryon' && (
                  <ShopTryOnSlide
                    autoStart={activeIndex === index}
                    onPhaseChange={(phase) => handlePhaseChange(phase as any, index)}
                    skipToComplete={skipToCompleteIndex === index}
                    products={item.products!}
                    modelImages={item.modelImages!}
                    resultImage={item.resultModelImage!}
                  />
                )}
              </>
            ) : (
              <FeatureSlide
                titleKey={item.titleKey}
                subtitleKey={item.subtitleKey}
                icon={item.icon || 'star'}
                accentColor={item.color || Colors.accent.primary}
              />
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom Button */}
      <Animated.View
        entering={FadeInUp.delay(100)}
        style={styles.bottomSection}
      >
        <Button
          title={isLastFeature ? t('common.continue') : t('common.next')}
          onPress={handleContinue}
          fullWidth
          size="lg"
          icon={<Ionicons name="arrow-forward" size={20} color={Colors.text.white} />}
          iconPosition="right"
        />
      </Animated.View>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
