// Analysis Result Page
// Kiyafet analizi sonuclarini gosterir

import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Share, Image, ImageBackground, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeContainer, Card, Button } from '@/components/ui';
import { Colors, Typography, Spacing, BorderRadius, Layout, Shadows } from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { OutfitAnalysis } from '@/services/openai';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import { useAuthContext } from '@/contexts';

// Score Circle Component (currently unused, kept for future use)
/*
function ScoreCircle({
  score,
  size = 80,
  label,
}: {
  score: number;
  size?: number;
  label?: string;
}) {
  const color = getScoreColor(score);

  return (
    <View style={[styles.scoreCircle, { width: size, height: size }]}>
      <View style={[styles.scoreCircleInner, { borderColor: color }]}>
        <Text style={[styles.scoreValue, { color, fontSize: size * 0.35 }]}>
          {score.toFixed(1)}
        </Text>
      </View>
      {label && <Text style={styles.scoreLabel}>{label}</Text>}
    </View>
  );
}
*/

// Get color based on score (red-yellow-green)
function getScoreBarColor(score: number): string {
  if (score >= 8.5) return '#22c55e'; // Green - Excellent
  if (score >= 7) return '#84cc16'; // Light Green - Good
  if (score >= 5.5) return '#eab308'; // Yellow - Average
  if (score >= 4) return '#f97316'; // Orange - Below Average
  return '#ef4444'; // Red - Poor
}

// Score Bar Component with dynamic color
function ScoreBar({ label, score }: { label: string; score: number }) {
  const color = getScoreBarColor(score);

  return (
    <View style={styles.scoreBarContainer}>
      <View style={styles.scoreBarHeader}>
        <Text style={styles.scoreBarLabel}>{label}</Text>
        <Text style={[styles.scoreBarValue, { color }]}>{score.toFixed(1)}/10</Text>
      </View>
      <View style={styles.scoreBarTrack}>
        <View
          style={[
            styles.scoreBarFill,
            { width: `${score * 10}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

// Item Card Component
function ItemCard({ item }: { item: { name: string; color: string; style: string; fit: string } }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemIcon}>
        <Ionicons name="shirt-outline" size={20} color={Colors.accent.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDetails}>
          {item.color} • {item.style} • {item.fit}
        </Text>
      </View>
    </View>
  );
}

// Suggestion Item
function SuggestionItem({ text, index }: { text: string; index: number }) {
  return (
    <View style={styles.suggestionItem}>
      <View style={styles.suggestionNumber}>
        <Text style={styles.suggestionNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.suggestionText}>{text}</Text>
    </View>
  );
}

export default function AnalysisResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { t } = useTranslation();
  const { isPremium } = useAuthContext();
  const [feedback, setFeedback] = useState<null | 'like' | 'dislike'>(null);

  // Params'dan analiz verisini al
  const analysisData: any = params.analysis
    ? JSON.parse(params.analysis as string)
    : null;

  // Params'dan veya analysis içinden imageUri'yi al
  const imageUri = params.imageUri as string || analysisData?.imageUri as string;

  // Analysis verisini al (imageUri olmadan)
  const analysis: OutfitAnalysis | null = analysisData;

  // Debug: Tüm params'ları yazdır
  console.log('[AnalysisResult] All params:', params);
  console.log('[AnalysisResult] imageUri from params:', params.imageUri);
  console.log('[AnalysisResult] imageUri from analysis:', analysisData?.imageUri);
  console.log('[AnalysisResult] Final imageUri:', imageUri);

  // Analiz verisi yoksa geri don
  if (!analysis) {
    console.error('[AnalysisResult] Analysis data is missing!');
    router.back();
    return null;
  }

  // imageUri yoksa uyarı ver ama geri dönme - placeholder göster
  if (!imageUri) {
    console.warn('[AnalysisResult] imageUri is missing, will show placeholder');
  }

  const handleClose = () => {
    router.back();
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: t('analysis.share.message', {
          appName: t('app.name'),
          score: analysis.overallScore,
          style: analysis.styleMatch.detectedStyle,
          comment: analysis.overallComment,
        }),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedback(feedback === 'like' ? null : 'like');
  };

  const handleDislike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFeedback(feedback === 'dislike' ? null : 'dislike');
  };

  const handleNewAnalysis = () => {
    router.replace('/(tabs)/dress-change');
  };

  const handlePaywallPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/paywall');
  };

  // Ortalama skor hesapla
  const avgScore =
    (analysis.overallScore +
      analysis.colorHarmony.score +
      analysis.styleMatch.score +
      analysis.seasonMatch.score) /
    4;

  return (
    <SafeContainer edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Image */}
        <View style={styles.imageHeader}>
          {/* Background Image */}
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.imageBackground}
              resizeMode="cover"
              onLoad={() => console.log('[AnalysisResult] Image loaded successfully')}
              onError={(error) => console.error('[AnalysisResult] Image load error:', error.nativeEvent)}
            />
          ) : (
            <View style={[styles.imageBackground, { backgroundColor: Colors.background.secondary }]} />
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
            style={styles.gradientOverlay}
          >
            {/* Header Controls */}
            <View style={styles.headerControls}>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <Ionicons name="chevron-back" size={28} color={Colors.text.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('analysis.result.title')}</Text>
              <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
                <Ionicons name="share-outline" size={24} color={Colors.text.white} />
              </TouchableOpacity>
            </View>

            {/* Like/Dislike Buttons - Only on Android */}
            {Platform.OS === 'android' && (
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  onPress={handleLike}
                  style={[
                    styles.feedbackButton,
                    feedback === 'like' && styles.feedbackButtonLikeActive
                  ]}
                >
                  <Ionicons
                    name={feedback === 'like' ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={20}
                    color={feedback === 'like' ? Colors.text.white : 'rgba(255,255,255,0.8)'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDislike}
                  style={[
                    styles.feedbackButton,
                    feedback === 'dislike' && styles.feedbackButtonDislikeActive
                  ]}
                >
                  <Ionicons
                    name={feedback === 'dislike' ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={20}
                    color={feedback === 'dislike' ? Colors.text.white : 'rgba(255,255,255,0.8)'}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Score Badge on Image */}
            <View style={styles.scoreOverlay}>
              <View style={styles.scoreCircleOnImage}>
                <Text style={styles.scoreValueOnImage}>{avgScore.toFixed(1)}</Text>
              </View>
              <Text style={styles.styleTagOnImage}>{analysis.styleMatch.detectedStyle}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
        {/* Overall Comment Card */}
        <Card style={styles.commentCard} variant="elevated">
          <Text style={styles.overallComment}>
            {analysis.overallComment}
          </Text>
        </Card>

        {/* Score Details */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.detailedScoring')}</Text>
          <ScoreBar
            label={t('analysis.result.scores.overall')}
            score={analysis.overallScore}
          />
          <ScoreBar
            label={t('analysis.result.scores.colorHarmony')}
            score={analysis.colorHarmony.score}
          />
          <ScoreBar
            label={t('analysis.result.scores.styleMatch')}
            score={analysis.styleMatch.score}
          />
          <ScoreBar
            label={t('analysis.result.scores.seasonMatch')}
            score={analysis.seasonMatch.score}
          />
        </Card>

        {/* Detected Items */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.sections.detectedItems')}</Text>
          {analysis.items.map((item, index) => (
            <ItemCard key={index} item={item} />
          ))}
        </Card>

        {/* Color Harmony */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.sections.colorAnalysis')}</Text>
          <Text style={styles.sectionComment}>{analysis.colorHarmony.comment}</Text>
          <View style={styles.colorPalette}>
            {analysis.colorHarmony.dominantColors.map((color, index) => (
              <View key={index} style={styles.colorChip}>
                <Text style={styles.colorChipText}>{color}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Occasion */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.sections.suitableOccasions')}</Text>
          <View style={styles.occasionContainer}>
            <Ionicons name="location-outline" size={20} color={Colors.accent.primary} />
            <Text style={styles.occasionText}>{analysis.styleMatch.occasion}</Text>
          </View>
          <View style={styles.seasonContainer}>
            <Ionicons name="sunny-outline" size={20} color={Colors.accent.primary} />
            <Text style={styles.seasonText}>
              {analysis.seasonMatch.suitableSeasons.join(', ')}
            </Text>
          </View>
        </Card>

        {/* Suggestions */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.sections.suggestions')}</Text>
          {analysis.suggestions.map((suggestion, index) => (
            <SuggestionItem key={index} text={suggestion} index={index} />
          ))}
        </Card>

        {/* Alternatives */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>{t('analysis.result.sections.alternatives')}</Text>
          {analysis.alternatives.map((alt, index) => (
            <View key={index} style={styles.alternativeItem}>
              <Ionicons name="swap-horizontal" size={16} color={Colors.text.muted} />
              <Text style={styles.alternativeText}>{alt}</Text>
            </View>
          ))}
        </Card>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title={t('analysis.result.actions.newAnalysis')}
            onPress={handleNewAnalysis}
            fullWidth
            size="lg"
            icon={<Ionicons name="camera" size={20} color={Colors.text.white} />}
          />
        </View>

        {/* Bottom padding */}
        <View style={{ height: Spacing['2xl'] }} />
        </View>
      </ScrollView>

      {/* Blur Overlay for Non-Premium Users */}
      {!isPremium && (
        <TouchableOpacity
          style={styles.blurOverlayContainer}
          activeOpacity={1}
          onPress={handlePaywallPress}
        >
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
            <View style={styles.paywallPrompt}>
              <View style={styles.lockIconContainer}>
                <Ionicons name="lock-closed" size={48} color={Colors.accent.primary} />
              </View>
              <Text style={styles.paywallTitle}>
                {t('analysis.result.paywall.title', { defaultValue: 'Premium Özellik' })}
              </Text>
              <Text style={styles.paywallSubtitle}>
                {t('analysis.result.paywall.subtitle', {
                  defaultValue: 'Analiz sonuçlarını görmek için Premium üyeliğe geçin'
                })}
              </Text>
              <View style={styles.paywallButton}>
                <Text style={styles.paywallButtonText}>
                  {t('analysis.result.paywall.button', { defaultValue: 'Premium\'a Geç' })}
                </Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.text.white} />
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageHeader: {
    width: '100%',
    height: hp('40%'),
    overflow: 'hidden',
    position: 'relative',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: hp('6%'),
    paddingBottom: Spacing.xl,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.text.white,
    fontWeight: '700',
  },
  feedbackButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Layout.screenPadding,
    marginTop: Spacing.sm,
  },
  feedbackButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  feedbackButtonLikeActive: {
    backgroundColor: '#22c55e',
  },
  feedbackButtonDislikeActive: {
    backgroundColor: '#ef4444',
  },
  scoreOverlay: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreCircleOnImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  scoreValueOnImage: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.text.primary,
  },
  styleTagOnImage: {
    ...Typography.h3,
    color: Colors.text.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  contentContainer: {
    padding: Layout.screenPadding,
    backgroundColor: Colors.text.white,
  },
  commentCard: {
    marginBottom: Spacing.lg,
  },
  overallComment: {
    ...Typography.body,
    color: Colors.text.secondary,
    lineHeight: 24,
  },
  scoreCircle: {
    alignItems: 'center',
  },
  scoreCircleInner: {
    width: '100%',
    height: '100%',
    borderRadius: wp('25%'),
    borderWidth: wp('1%'),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
  },
  scoreValue: {
    fontWeight: '700',
  },
  scoreLabel: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  sectionComment: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  scoreBarContainer: {
    marginBottom: Spacing.md,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  scoreBarLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  scoreBarValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  scoreBarTrack: {
    height: hp('1.2%'),
    backgroundColor: '#E5E5E5',
    borderRadius: wp('1%'),
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: wp('1%'),
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: hp('0.1%'),
    borderBottomColor: Colors.border.light,
  },
  itemIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2%'),
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemDetails: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorChip: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  colorChipText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  occasionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  occasionText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    flexWrap: 'wrap',
  },
  seasonContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  seasonText: {
    ...Typography.body,
    color: Colors.text.primary,
    flex: 1,
    flexWrap: 'wrap',
  },
  suggestionItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  suggestionNumber: {
    width: wp('6%'),
    height: wp('6%'),
    borderRadius: wp('3%'),
    backgroundColor: Colors.accent.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionNumberText: {
    ...Typography.caption,
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  suggestionText: {
    ...Typography.body,
    color: Colors.text.secondary,
    flex: 1,
  },
  alternativeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: hp('0.1%'),
    borderBottomColor: Colors.border.light,
  },
  alternativeText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  bottomActions: {
    marginTop: Spacing.lg,
  },
  blurOverlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  paywallPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding * 2,
    gap: Spacing.lg,
  },
  lockIconContainer: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    backgroundColor: Colors.accent.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  paywallTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
  paywallSubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  paywallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
    ...Shadows.md,
  },
  paywallButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
  },
});
