// Theme Constants - AI Dress & Outfit Analyzer
// Modern beyaz tonları teması

import { Platform } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Responsive helper functions
export const responsive = {
  width: wp,
  height: hp,
  // Font size based on screen width
  fontSize: (size: number) => wp(size * 0.26),
  // Spacing based on screen width
  spacing: (size: number) => wp(size * 0.26),
};

// Screen breakpoints
export const isSmallDevice = wp('100%') < 375;
export const isMediumDevice = wp('100%') >= 375 && wp('100%') < 414;
export const isLargeDevice = wp('100%') >= 414;

export const Colors = {
  // Background Colors - iOS system backgrounds
  background: {
    start: '#FFFFFF',      // Pure white
    end: '#F9F9F9',        // Very light gray
    secondary: '#F2F2F7',  // iOS system gray (secondary background)
  },

  // Card Backgrounds
  card: {
    primary: '#FFFFFF',    // Beyaz
    secondary: '#F8F9FA',  // Açık gri
    elevated: '#FFFFFF',   // Beyaz (gölgeli)
  },

  // Accent Colors
  accent: {
    primary: '#1A1A1A',       // Rich Black
    primaryLight: '#2D2D2D',  // Açık siyah
    primarySoft: 'rgba(26, 26, 26, 0.1)', // Soft black background
    success: '#10B981',       // Yeşil
    warning: '#F59E0B',       // Turuncu
    error: '#EF4444',         // Kırmızı
    info: '#3B82F6',          // Mavi (bilgi)
  },

  // Text Colors
  text: {
    primary: '#1A1A2E',       // Koyu lacivert (ana metin)
    secondary: '#64748B',     // Gri (açıklama)
    muted: '#94A3B8',         // Açık gri
    disabled: '#CBD5E1',      // Çok açık gri
    white: '#FFFFFF',         // Beyaz metin (butonlar için)
  },

  // Premium/Gold
  premium: {
    start: '#FFD700',         // Altın
    end: '#FFA500',           // Turuncu
  },

  // Overlay
  overlay: {
    light: 'rgba(0,0,0,0.4)',
    medium: 'rgba(0,0,0,0.5)',
    dark: 'rgba(0,0,0,0.6)',
    darker: 'rgba(0,0,0,0.8)',
  },

  // Secondary accent colors
  secondary: {
    purple: '#8B5CF6',
    purpleSoft: 'rgba(139, 92, 246, 0.1)',
    pink: '#EC4899',
    pinkSoft: 'rgba(236, 72, 153, 0.1)',
    cyan: '#06B6D4',
    cyanSoft: 'rgba(6, 182, 212, 0.1)',
    // Neutral grays
    darkGray: '#4A4A4A',
    darkGraySoft: 'rgba(74, 74, 74, 0.12)',
    mediumGray: '#6B7280',
    mediumGraySoft: 'rgba(107, 114, 128, 0.12)',
  },

  // Border
  border: {
    default: '#E2E8F0',
    light: '#F1F5F9',
  },

  // Tab Bar
  tabBar: {
    background: 'rgba(255, 255, 255, 0.95)',
    active: '#6366F1',
    inactive: '#A5B4FC',
  },

  // Success
  success: {
    main: '#10B981',
    background: '#D1FAE5',
    light: '#6EE7B7',
    dark: '#059669',
  },

  // Shadows
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
  },
} as const;

export const Gradients = {
  background: {
    colors: [Colors.background.start, Colors.background.end] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  card: {
    colors: [Colors.card.primary, Colors.card.secondary] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  button: {
    colors: ['#1A1A1A', '#2D2D2D'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  premium: {
    colors: [Colors.premium.start, Colors.premium.end] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  subtle: {
    colors: ['#F8F9FA', '#FFFFFF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
};

export const Spacing = {
  xs: wp('1%'),      // ~4
  sm: wp('2%'),      // ~8
  md: wp('3%'),      // ~12
  base: wp('4%'),    // ~16
  lg: wp('5%'),      // ~20
  xl: wp('6%'),      // ~24
  '2xl': wp('8%'),   // ~32
  '3xl': wp('10%'),  // ~40
  '4xl': wp('12%'),  // ~48
  '5xl': wp('16%'),  // ~64
} as const;

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const Typography = {
  // Hero
  h1: {
    fontSize: wp('8%'),      // ~32
    fontWeight: '700' as const,
    lineHeight: wp('10%'),   // ~40
    letterSpacing: -0.5,
  },
  // Section
  h2: {
    fontSize: wp('6%'),      // ~24
    fontWeight: '600' as const,
    lineHeight: wp('8%'),    // ~32
    letterSpacing: -0.3,
  },
  // Card Title
  h3: {
    fontSize: wp('4.5%'),    // ~18
    fontWeight: '600' as const,
    lineHeight: wp('6%'),    // ~24
    letterSpacing: 0,
  },
  // Body
  body: {
    fontSize: wp('4%'),      // ~16
    fontWeight: '400' as const,
    lineHeight: wp('6%'),    // ~24
    letterSpacing: 0,
  },
  // Body Small
  bodySmall: {
    fontSize: wp('3.5%'),    // ~14
    fontWeight: '400' as const,
    lineHeight: wp('5%'),    // ~20
    letterSpacing: 0,
  },
  // Caption
  caption: {
    fontSize: wp('3%'),      // ~12
    fontWeight: '500' as const,
    lineHeight: wp('4%'),    // ~16
    letterSpacing: 0.2,
  },
  // Tag/Badge
  tag: {
    fontSize: wp('2.5%'),    // ~10
    fontWeight: '500' as const,
    lineHeight: wp('3.5%'),  // ~14
    letterSpacing: 0.5,
  },
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 3,
    },
    android: {
      elevation: 3,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
    },
    android: {
      elevation: 4,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#1A1A1A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }),
} as const;

export const Animation = {
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
  },
} as const;

// Layout constants
export const Layout = {
  screenPadding: wp('4%'),     // ~16
  cardPadding: wp('4%'),       // ~16
  cardGap: wp('3%'),           // ~12
  sectionGap: wp('6%'),        // ~24
  tabBarHeight: hp('10%'),     // ~80
  headerHeight: hp('7%'),      // ~56
} as const;

// Icon sizes
export const IconSizes = {
  xs: wp('4%'),      // ~16
  sm: wp('5%'),      // ~20
  md: wp('6%'),      // ~24
  lg: wp('8%'),      // ~32
  xl: wp('10%'),     // ~40
  '2xl': wp('12%'),  // ~48
  '3xl': wp('14%'),  // ~56
  '4xl': wp('16%'),  // ~64
} as const;

// Container sizes (for icon backgrounds, avatars, etc.)
export const ContainerSizes = {
  xs: wp('7%'),      // ~28
  sm: wp('8%'),      // ~32
  md: wp('10%'),     // ~40
  lg: wp('12%'),     // ~48
  xl: wp('14%'),     // ~56
  '2xl': wp('16%'),  // ~64
  '3xl': wp('20%'),  // ~80
} as const;

// Aspect ratios
export const AspectRatios = {
  square: 1,
  portrait: 3 / 4,
  landscape: 4 / 3,
  wide: 16 / 9,
} as const;

// App limits
export const Limits = {
  dailyAnalysis: 3,
  maxImageSizeMB: 10,
  maxImageWidth: 1024,
  maxImageHeight: 1024,
  imageQuality: 0.8,
} as const;

// Onboarding Colors
export const OnboardingColors = {
  stepActive: '#1A1A1A',
  stepInactive: Colors.border.light,
  stepCompleted: Colors.accent.success,
  optionBorder: Colors.border.default,
  optionBorderSelected: '#1A1A1A',
  optionBackground: Colors.card.primary,
  optionBackgroundSelected: 'rgba(26, 26, 26, 0.1)',
} as const;

// Wardrobe Category Colors
export const CategoryColors: Record<string, string> = {
  tops: '#1A1A1A',       // Rich Black
  bottoms: '#8B5CF6',    // Purple
  shoes: '#EC4899',      // Pink
  accessories: '#F59E0B', // Amber
  outerwear: '#10B981',  // Emerald
  dresses: '#06B6D4',    // Cyan
} as const;

// Season Colors
export const SeasonColors = {
  spring: '#10B981',  // Yesil - Ilkbahar
  summer: '#F59E0B',  // Sari - Yaz
  fall: '#EF4444',    // Kirmizi/Turuncu - Sonbahar
  winter: '#3B82F6',  // Mavi - Kis
} as const;

// Extended Animation Config for Reanimated
export const Animations = {
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  springBouncy: {
    damping: 10,
    stiffness: 180,
    mass: 0.8,
  },
  springSmooth: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  fadeIn: {
    duration: 300,
    delay: 50,
  },
  slideIn: {
    duration: 350,
  },
  scale: {
    pressed: 0.96,
    normal: 1,
  },
} as const;

// Gradient Presets for Onboarding
export const OnboardingGradients = {
  welcome: {
    colors: ['#1A1A1A', '#2D2D2D', '#404040'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  feature: {
    colors: ['#F8F9FA', '#FFFFFF'] as const,
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },
  complete: {
    colors: ['#10B981', '#34D399'] as const,
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
} as const;
