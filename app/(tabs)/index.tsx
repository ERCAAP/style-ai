import { Card, Header, PremiumBadge, SafeContainer } from '@/components/ui';
import { MiniAnalysisAnimation, MiniOutfitTryAnimation } from '@/components/animated';
import { BorderRadius, Colors, ContainerSizes, IconSizes, Layout, Spacing, Typography } from '@/constants/theme';
import { useAuthContext } from '@/contexts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

// Liquid Glass Feature Card
function FeatureCard({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
  iconComponent,
}: {
  icon?: string;
  iconColor?: string;
  iconBgColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  iconComponent?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.featureCard} onPress={onPress} activeOpacity={0.8}>
      <BlurView intensity={40} tint="light" style={styles.featureCardBlur}>
        <View style={styles.featureCardGlass} />
        <View style={styles.featureCardHighlight} />
        <View style={styles.featureCardContent}>
          <View style={[styles.featureIcon, { backgroundColor: iconBgColor }]}>
            {iconComponent || (
              <Ionicons name={icon as any} size={IconSizes.lg} color={iconColor} />
            )}
          </View>
          <View style={styles.featureText}>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureSubtitle}>{subtitle}</Text>
          </View>
          <Ionicons name="chevron-forward" size={IconSizes.md} color={Colors.text.muted} />
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { isPremium, analysisRemaining } = useAuthContext();
  const { t } = useTranslation();

  const handleAnalysisPress = () => {
    // Kullaniciyi analiz ekranina yonlendir
    // Premium kontrolu analiz ekraninda yapilacak
    router.push('/outfit-analysis');
  };

  const handleTryOutfitPress = () => {
    // Ana sayfadan dogrudan outfit-try'a yonlendir
    router.push('/outfit-try');
  };

  return (
    <SafeContainer>
      <Header
        showLogo
        rightAction={<PremiumBadge onPress={() => router.push('/paywall')} />}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('home.heroSubtitle')}
          </Text>
        </View>

        {/* Ana Ozellikler */}
        <View style={styles.featuresSection}>
          {/* Kiyafetimi Analiz Et */}
          <FeatureCard
            iconBgColor={Colors.accent.primarySoft}
            title={t('home.features.analyzeOutfit.title')}
            subtitle={t('home.features.analyzeOutfit.subtitle')}
            onPress={handleAnalysisPress}
            iconComponent={
              <MiniAnalysisAnimation
                size={ContainerSizes['2xl']}
              />
            }
          />

          {/* Kiyafeti Dene */}
          <FeatureCard
            iconBgColor="rgba(99, 102, 241, 0.1)"
            title={t('home.features.tryOutfit.title')}
            subtitle={t('home.features.tryOutfit.subtitle')}
            onPress={handleTryOutfitPress}
            iconComponent={
              <MiniOutfitTryAnimation
                size={ContainerSizes['2xl']}
              />
            }
          />

        </View>

        {/* Bilgi Karti */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Ionicons name="information-circle-outline" size={IconSizes.sm} color="#000000" />
              <Text style={styles.infoTitle}>{t('home.howItWorks.title')}</Text>
            </View>
            <View style={styles.infoSteps}>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>{t('home.howItWorks.step1')}</Text>
              </View>
              <View style={styles.infoStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>{t('home.howItWorks.step2')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: Layout.tabBarHeight + Spacing.xl }} />
      </ScrollView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: Spacing.base,
  },
  heroSection: {
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.h1,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
  },
  featureCard: {
    borderRadius: wp('5%'),
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    }),
    elevation: 4,
  },
  featureCardBlur: {
    overflow: 'hidden',
  },
  featureCardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
  },
  featureCardHighlight: {
    position: 'absolute',
    top: 0,
    left: wp('5%'),
    right: wp('5%'),
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  featureCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  featureIcon: {
    width: ContainerSizes['2xl'],
    height: ContainerSizes['2xl'],
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: hp('0.5%'),
  },
  featureSubtitle: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  infoSection: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
  },
  infoCard: {
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
    borderRadius: wp('5%'),
    padding: Spacing.base,
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    ...(Platform.OS === 'ios' && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    }),
    elevation: 3,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  infoTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  infoSteps: {
    gap: Spacing.md,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepNumber: {
    width: ContainerSizes.xs,
    height: ContainerSizes.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '700',
  },
  stepText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
  },
});
