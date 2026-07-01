// Onboarding Constants - Onboarding configuration constants

import { OnboardingStep, OnboardingOption } from '@/types/onboarding';

// Style options
export const STYLE_OPTIONS: OnboardingOption[] = [
  { id: 'casual', labelKey: 'onboarding.styles.casual', icon: 'shirt-outline', value: 'casual' },
  { id: 'formal', labelKey: 'onboarding.styles.formal', icon: 'business-outline', value: 'formal' },
  { id: 'sporty', labelKey: 'onboarding.styles.sporty', icon: 'fitness-outline', value: 'sporty' },
  { id: 'elegant', labelKey: 'onboarding.styles.elegant', icon: 'diamond-outline', value: 'elegant' },
  { id: 'bohemian', labelKey: 'onboarding.styles.bohemian', icon: 'leaf-outline', value: 'bohemian' },
  { id: 'minimalist', labelKey: 'onboarding.styles.minimalist', icon: 'square-outline', value: 'minimalist' },
];

// Body type options
export const BODY_TYPE_OPTIONS: OnboardingOption[] = [
  { id: 'rectangle', labelKey: 'onboarding.bodyTypes.rectangle', icon: 'square-outline', value: 'rectangle' },
  { id: 'triangle', labelKey: 'onboarding.bodyTypes.triangle', icon: 'triangle-outline', value: 'triangle' },
  { id: 'inverted_triangle', labelKey: 'onboarding.bodyTypes.inverted_triangle', icon: 'caret-down-outline', value: 'inverted_triangle' },
  { id: 'hourglass', labelKey: 'onboarding.bodyTypes.hourglass', icon: 'hourglass-outline', value: 'hourglass' },
  { id: 'oval', labelKey: 'onboarding.bodyTypes.oval', icon: 'ellipse-outline', value: 'oval' },
];

// Color options
export const COLOR_OPTIONS: OnboardingOption[] = [
  { id: 'black', labelKey: 'colors.black', value: 'black', color: '#000000' },
  { id: 'white', labelKey: 'colors.white', value: 'white', color: '#FFFFFF' },
  { id: 'gray', labelKey: 'colors.gray', value: 'gray', color: '#6B7280' },
  { id: 'navy', labelKey: 'colors.navy', value: 'navy', color: '#1E3A5F' },
  { id: 'blue', labelKey: 'colors.blue', value: 'blue', color: '#3B82F6' },
  { id: 'red', labelKey: 'colors.red', value: 'red', color: '#EF4444' },
  { id: 'green', labelKey: 'colors.green', value: 'green', color: '#10B981' },
  { id: 'yellow', labelKey: 'colors.yellow', value: 'yellow', color: '#F59E0B' },
  { id: 'purple', labelKey: 'colors.purple', value: 'purple', color: '#8B5CF6' },
  { id: 'pink', labelKey: 'colors.pink', value: 'pink', color: '#EC4899' },
  { id: 'brown', labelKey: 'colors.brown', value: 'brown', color: '#92400E' },
  { id: 'beige', labelKey: 'colors.beige', value: 'beige', color: '#D4C4B0' },
];

// Usage goal options
export const USAGE_GOAL_OPTIONS: OnboardingOption[] = [
  { id: 'work', labelKey: 'onboarding.goals.work', icon: 'briefcase-outline', value: 'work' },
  { id: 'special_events', labelKey: 'onboarding.goals.special_events', icon: 'star-outline', value: 'special_events' },
  { id: 'style_improvement', labelKey: 'onboarding.goals.style_improvement', icon: 'trending-up-outline', value: 'style_improvement' },
];

// Onboarding steps
export const ONBOARDING_STEPS: OnboardingStep[] = [
  // Welcome
  {
    id: 'welcome',
    type: 'welcome',
    titleKey: 'onboarding.welcome.title',
    subtitleKey: 'onboarding.welcome.subtitle',
    icon: 'sparkles',
  },
  // Features - Contains 3 slides (AI Analysis, Outfit Transfer, Shop Try On)
  {
    id: 'features-slide-1',
    type: 'feature',
    titleKey: 'onboarding.features.analysis.title',
    subtitleKey: 'onboarding.features.analysis.subtitle',
    icon: 'analytics-outline',
  },
  {
    id: 'features-slide-2',
    type: 'feature',
    titleKey: 'onboarding.outfitTransfer.title',
    subtitleKey: 'onboarding.outfitTransfer.subtitle',
    icon: 'swap-horizontal-outline',
  },
  {
    id: 'features-slide-3',
    type: 'feature',
    titleKey: 'onboarding.shopTryOn.title',
    subtitleKey: 'onboarding.shopTryOn.subtitle',
    icon: 'cart-outline',
  },
  // Question 1 - Style Preference
  {
    id: 'question-style',
    type: 'question',
    titleKey: 'onboarding.questions.style.title',
    subtitleKey: 'onboarding.questions.style.subtitle',
    question: {
      id: 'style',
      questionKey: 'stylePreferences',
      type: 'multiple',
      required: true,
      minSelect: 1,
      options: STYLE_OPTIONS,
    },
  },
  // Question 2 - Body Type
  {
    id: 'question-body-type',
    type: 'question',
    titleKey: 'onboarding.questions.bodyType.title',
    subtitleKey: 'onboarding.questions.bodyType.subtitle',
    question: {
      id: 'bodyType',
      questionKey: 'bodyType',
      type: 'single',
      required: true,
      options: BODY_TYPE_OPTIONS,
    },
  },
  // Question 3 - Favorite Colors
  {
    id: 'question-colors',
    type: 'question',
    titleKey: 'onboarding.questions.colors.title',
    subtitleKey: 'onboarding.questions.colors.subtitle',
    question: {
      id: 'colors',
      questionKey: 'favoriteColors',
      type: 'color_picker',
      required: true,
      minSelect: 1,
      maxSelect: 5,
      options: COLOR_OPTIONS,
    },
  },
  // Question 4 - Usage Goals
  {
    id: 'question-goals',
    type: 'question',
    titleKey: 'onboarding.questions.goals.title',
    subtitleKey: 'onboarding.questions.goals.subtitle',
    question: {
      id: 'goals',
      questionKey: 'usageGoals',
      type: 'multiple',
      required: true,
      minSelect: 1,
      maxSelect: 5,
      options: USAGE_GOAL_OPTIONS,
    },
  },
  // Completion
  {
    id: 'complete',
    type: 'completion',
    titleKey: 'onboarding.complete.title',
    subtitleKey: 'onboarding.complete.subtitle',
    icon: 'checkmark-circle',
  },
];

// Total number of steps
export const TOTAL_ONBOARDING_STEPS = ONBOARDING_STEPS.length;

// AsyncStorage keys
export const ONBOARDING_STORAGE_KEYS = {
  ANSWERS: '@styleai_onboarding_answers',
  COMPLETED: '@styleai_onboarding_completed',
  SKIPPED: '@styleai_onboarding_skipped',
} as const;
