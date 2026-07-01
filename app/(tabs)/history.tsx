// History Screen - Analysis & Try-On Results
// Kullanicinin tum analiz ve kiyafet deneme sonuclarini listeler

import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeContainer, Card } from '@/components/ui';
import { useAnalysisHistory, AnalysisHistoryItem, useTryOnHistory, TryOnHistoryItem } from '@/hooks';
import { useAuthContext } from '@/contexts';
import { getScoreColor, getScoreLevel } from '@/services/openai';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Layout,
} from '@/constants/theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

type TabType = 'analysis' | 'tryon';

// Score Badge Component
function ScoreBadge({ score, isPremium }: { score: number; isPremium: boolean }) {
  const color = getScoreColor(score);

  return (
    <View style={[styles.scoreBadge, { backgroundColor: isPremium ? color : '#000000' }]}>
      <Text style={styles.scoreBadgeText}>{isPremium ? score.toFixed(1) : '?'}</Text>
    </View>
  );
}

// History Item Card Component
function HistoryItemCard({
  item,
  index,
  onPress,
  isPremium,
}: {
  item: AnalysisHistoryItem;
  index: number;
  onPress: () => void;
  isPremium: boolean;
}) {
  const formattedDate = new Date(item.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const styleText = item.analysis.styleMatch.detectedStyle;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.historyCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <BlurView intensity={30} tint="light" style={styles.cardBlur}>
          <View style={styles.cardGlass} />
          <View style={styles.cardContent}>
            {/* Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              {!isPremium && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockQuestionMark}>?</Text>
                </View>
              )}
              <ScoreBadge score={item.averageScore} isPremium={isPremium} />
            </View>

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.styleText} numberOfLines={1}>
                {styleText}
              </Text>
              <Text style={styles.commentText} numberOfLines={2}>
                {item.analysis.overallComment}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={Colors.text.muted}
                />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </View>

            {/* Arrow */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.text.muted}
            />
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Tab Switcher Component
function TabSwitcher({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (tab: TabType) => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'analysis' && styles.tabActive]}
        onPress={() => onTabChange('analysis')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="analytics"
          size={18}
          color={activeTab === 'analysis' ? Colors.accent.primary : Colors.text.muted}
        />
        <Text style={[styles.tabText, activeTab === 'analysis' && styles.tabTextActive]}>
          {t('history.tabs.analysis')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'tryon' && styles.tabActive]}
        onPress={() => onTabChange('tryon')}
        activeOpacity={0.7}
      >
        <Ionicons
          name="shirt"
          size={18}
          color={activeTab === 'tryon' ? Colors.accent.primary : Colors.text.muted}
        />
        <Text style={[styles.tabText, activeTab === 'tryon' && styles.tabTextActive]}>
          {t('history.tabs.tryOn')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// Try-On Item Card Component
function TryOnItemCard({
  item,
  index,
  onPress,
  isPremium,
}: {
  item: TryOnHistoryItem;
  index: number;
  onPress: () => void;
  isPremium: boolean;
}) {
  const { t } = useTranslation();
  const formattedDate = new Date(item.createdAt).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.historyCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <BlurView intensity={30} tint="light" style={styles.cardBlur}>
          <View style={styles.cardGlass} />
          <View style={styles.cardContent}>
            {/* Result Image */}
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: item.resultImageUrl }}
                style={styles.itemImage}
                resizeMode="cover"
              />
              {!isPremium && (
                <View style={styles.lockOverlay}>
                  <Text style={styles.lockQuestionMark}>?</Text>
                </View>
              )}
              <View style={styles.tryOnBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.text.white} />
              </View>
            </View>

            {/* Info */}
            <View style={styles.itemInfo}>
              <Text style={styles.styleText} numberOfLines={1}>
                {t('history.tryOnItem.title')}
              </Text>
              <Text style={styles.commentText} numberOfLines={2}>
                {t('history.tryOnItem.clothingCount', { count: item.clothingImages.length })}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons
                  name="calendar-outline"
                  size={12}
                  color={Colors.text.muted}
                />
                <Text style={styles.dateText}>{formattedDate}</Text>
              </View>
            </View>

            {/* Arrow */}
            <Ionicons
              name="chevron-forward"
              size={20}
              color={Colors.text.muted}
            />
          </View>
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Empty State Component
function EmptyState({ activeTab }: { activeTab: TabType }) {
  const router = useRouter();
  const { t } = useTranslation();

  const handlePress = () => {
    if (activeTab === 'analysis') {
      router.push('/outfit-analysis');
    } else {
      router.push('/outfit-try');
    }
  };

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={activeTab === 'analysis' ? 'analytics-outline' : 'shirt-outline'}
          size={64}
          color={Colors.text.muted}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {activeTab === 'analysis' ? t('history.empty.analysis.title') : t('history.empty.tryOn.title')}
      </Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'analysis'
          ? t('history.empty.analysis.subtitle')
          : t('history.empty.tryOn.subtitle')}
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={handlePress}
      >
        <Ionicons name="sparkles" size={18} color={Colors.text.white} />
        <Text style={styles.emptyButtonText}>
          {activeTab === 'analysis' ? t('history.empty.analysis.button') : t('history.empty.tryOn.button')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { isPremium } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('tryon'); // Default to try-on

  // Analysis history
  const {
    history: analysisHistory,
    isLoading: analysisLoading,
    isRefreshing: analysisRefreshing,
    error: analysisError,
    refresh: refreshAnalysis,
  } = useAnalysisHistory();

  // Try-On history
  const {
    history: tryOnHistory,
    isLoading: tryOnLoading,
    error: tryOnError,
    refresh: refreshTryOn,
  } = useTryOnHistory();

  const handleAnalysisItemPress = useCallback(
    (item: AnalysisHistoryItem) => {
      // Premium değilse direkt paywall'a yönlendir
      if (!isPremium) {
        router.push('/paywall');
        return;
      }

      // Premium ise normal sonuç ekranına git
      const analysisWithImage = {
        ...item.analysis,
        imageUri: item.imageUrl,
      };
      router.push({
        pathname: '/analysis-result',
        params: { analysis: JSON.stringify(analysisWithImage) },
      });
    },
    [router, isPremium]
  );

  const handleTryOnItemPress = useCallback(
    (item: TryOnHistoryItem) => {
      // Premium değilse direkt paywall'a yönlendir
      if (!isPremium) {
        router.push('/paywall');
        return;
      }

      // Premium ise normal sonuç ekranına git
      router.push({
        pathname: '/outfit-try-result',
        params: {
          imageUrl: item.resultImageUrl,
          userImageUri: item.userImageUri,
          targetImageUris: JSON.stringify(item.clothingImages),
          predictionId: item.predictionId || '',
        },
      });
    },
    [router, isPremium]
  );

  const renderAnalysisItem = useCallback(
    ({ item, index }: { item: AnalysisHistoryItem; index: number }) => (
      <HistoryItemCard
        item={item}
        index={index}
        onPress={() => handleAnalysisItemPress(item)}
        isPremium={isPremium}
      />
    ),
    [handleAnalysisItemPress, isPremium]
  );

  const renderTryOnItem = useCallback(
    ({ item, index }: { item: TryOnHistoryItem; index: number }) => (
      <TryOnItemCard
        item={item}
        index={index}
        onPress={() => handleTryOnItemPress(item)}
        isPremium={isPremium}
      />
    ),
    [handleTryOnItemPress, isPremium]
  );

  const keyExtractor = useCallback((item: AnalysisHistoryItem | TryOnHistoryItem) => item.id, []);

  const handleRefresh = useCallback(async () => {
    if (activeTab === 'analysis') {
      await refreshAnalysis();
    } else {
      await refreshTryOn();
    }
  }, [activeTab, refreshAnalysis, refreshTryOn]);

  // AppState listener - uygulama ön plana geldiğinde geçmişi yenile
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // Uygulama ön plana geldiğinde geçmişi yenile
      if (nextAppState === 'active') {
        console.log('[History] App became active, refreshing history...');
        handleRefresh();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleRefresh]);

  // Tab değiştiğinde geçmişi yenile
  useEffect(() => {
    console.log('[History] Active tab changed to:', activeTab, '- refreshing...');
    handleRefresh();
  }, [activeTab, handleRefresh]);

  const currentHistory = activeTab === 'analysis' ? analysisHistory : tryOnHistory;
  const currentLoading = activeTab === 'analysis' ? analysisLoading : tryOnLoading;
  const currentRefreshing = activeTab === 'analysis' ? analysisRefreshing : false;
  const currentError = activeTab === 'analysis' ? analysisError : tryOnError;
  const currentRender = activeTab === 'analysis' ? renderAnalysisItem : renderTryOnItem;

  return (
    <SafeContainer edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('history.title')}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.countText}>
            {t(activeTab === 'analysis' ? 'history.count.analysis' : 'history.count.tryOn', {
              count: currentHistory.length
            })}
          </Text>
        </View>
      </View>

      {/* Tab Switcher */}
      <TabSwitcher activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Content */}
      {currentLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.accent.primary} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : currentError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.accent.error} />
          <Text style={styles.errorText}>{currentError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : currentHistory.length === 0 ? (
        <EmptyState activeTab={activeTab} />
      ) : (
        <FlatList
          data={currentHistory}
          renderItem={currentRender as any}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={currentRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.accent.primary}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.screenPadding,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  headerRight: {
    minWidth: wp('15%'),
    alignItems: 'flex-end',
  },
  countText: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.muted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding,
    gap: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.white,
    fontWeight: '600',
  },
  listContent: {
    padding: Layout.screenPadding,
    paddingBottom: Layout.tabBarHeight + Spacing['2xl'],
  },
  separator: {
    height: Spacing.md,
  },
  historyCard: {
    borderRadius: wp('4%'),
    overflow: 'hidden',
    borderWidth: wp('0.3%'),
    borderColor: 'rgba(255, 255, 255, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hp('0.5%') },
    shadowOpacity: 0.1,
    shadowRadius: wp('3%'),
    elevation: 3,
  },
  cardBlur: {
    overflow: 'hidden',
  },
  cardGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
  },
  itemImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockQuestionMark: {
    ...Typography.h1,
    color: Colors.text.white,
    fontWeight: '700',
    fontSize: 32,
  },
  scoreBadge: {
    position: 'absolute',
    bottom: -Spacing.xs,
    right: -Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
    minWidth: wp('10%'),
    alignItems: 'center',
  },
  scoreBadgeText: {
    ...Typography.caption,
    color: Colors.text.white,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  styleText: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  commentText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  dateText: {
    ...Typography.caption,
    color: Colors.text.muted,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screenPadding * 2,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: wp('30%'),
    height: wp('30%'),
    borderRadius: wp('15%'),
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyButtonText: {
    ...Typography.body,
    color: Colors.text.white,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  tabActive: {
    backgroundColor: Colors.text.white,
  },
  tabText: {
    ...Typography.bodySmall,
    color: Colors.text.muted,
  },
  tabTextActive: {
    color: Colors.accent.primary,
    fontWeight: '600',
  },
  tryOnBadge: {
    position: 'absolute',
    bottom: -Spacing.xs,
    right: -Spacing.xs,
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
});
