// Wardrobe Screen - Dolabim ana ekrani

import { Button, PhotoPickerModal, SafeContainer } from '@/components/ui';
import { CategoryFilter, EmptyWardrobe, WardrobeItemCard } from '@/components/wardrobe';
import {
  BorderRadius,
  CategoryColors,
  Colors,
  SeasonColors,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useWardrobe } from '@/hooks';
import { scrapeProductImage } from '@/services/urlScraper';
import { ClothingCategory, CreateWardrobeItemInput, Season, SUBCATEGORIES } from '@/types/wardrobe';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { cacheDirectory, downloadAsync } from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { Layout as AnimatedLayout, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const CATEGORIES: ClothingCategory[] = ['tops', 'bottoms', 'shoes', 'accessories', 'outerwear', 'dresses'];
const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];

export default function WardrobeScreen() {
  const { t } = useTranslation();
  const {
    items,
    filteredItems,
    stats,
    isLoading,
    isRefreshing,
    filters,
    setCategory,
    setSearchQuery,
    addItem,
    deleteItem,
    toggleItemFavorite,
    recordItemWear,
    refresh,
  } = useWardrobe();

  const [selectedCategory, setSelectedCategory] = useState<ClothingCategory | null>(null);
  const [searchQuery, setSearchQueryLocal] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [statsPeriod, setStatsPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Add modal state
  const [addForm, setAddForm] = useState<{
    name: string;
    category: ClothingCategory;
    subcategory: string;
    season: Season[];
    color: string;
    colorHex: string;
    brand: string;
    notes: string;
    imageUri: string | null;
  }>({
    name: '',
    category: 'tops',
    subcategory: '',
    color: '',
    colorHex: '#000000',
    season: [],
    brand: '',
    notes: '',
    imageUri: null,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [addProgress, setAddProgress] = useState(0);
  const [showPhotoPickerModal, setShowPhotoPickerModal] = useState(false);
  const [isUrlLoading, setIsUrlLoading] = useState(false);

  // Animation for wear count
  const wearCountScale = useSharedValue(1);

  const handleCategorySelect = useCallback((category: ClothingCategory | null) => {
    setSelectedCategory(category);
    setCategory(category);
  }, [setCategory]);

  const handleSearch = useCallback((query: string) => {
    setSearchQueryLocal(query);
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleItemPress = useCallback((item: any) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  }, []);

  const handleAddPress = useCallback(() => {
    setAddForm({
      name: '',
      category: 'tops',
      subcategory: '',
      color: '',
      colorHex: '#000000',
      season: [],
      brand: '',
      notes: '',
      imageUri: null,
    });
    setShowAddModal(true);
  }, []);

  const handleOpenPhotoPicker = useCallback(() => {
    // Add Modal'i gecici olarak kapat, boylece crop ekrani duzgun gorunur
    setShowAddModal(false);
    // Photo picker'i ac
    setShowPhotoPickerModal(true);
  }, []);

  const handleCameraPress = useCallback(async () => {
    setShowPhotoPickerModal(false);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.cameraPermission.title'), t('dressChange.alerts.cameraPermission.message'));
      // Add Modal'i tekrar ac
      setShowAddModal(true);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAddForm(prev => ({ ...prev, imageUri: result.assets[0].uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Her durumda Add Modal'i tekrar ac (foto secildi veya iptal edildi)
    setShowAddModal(true);
  }, [t]);

  const handleGalleryPress = useCallback(async () => {
    setShowPhotoPickerModal(false);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('dressChange.alerts.galleryPermission.title'), t('dressChange.alerts.galleryPermission.message'));
      // Add Modal'i tekrar ac
      setShowAddModal(true);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAddForm(prev => ({ ...prev, imageUri: result.assets[0].uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Her durumda Add Modal'i tekrar ac (foto secildi veya iptal edildi)
    setShowAddModal(true);
  }, [t]);

  const handleUrlSubmit = useCallback(async (url: string): Promise<boolean> => {
    setIsUrlLoading(true);
    try {
      // URL'den görsel çek
      const result = await scrapeProductImage(url);
      if (!result.success || !result.productImage) {
        return false;
      }

      // Görseli indir
      const filename = `wardrobe_${Date.now()}.jpg`;
      const localUri = `${cacheDirectory}${filename}`;
      const downloadResult = await downloadAsync(result.productImage.url, localUri, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        },
      });

      if (downloadResult.status !== 200) {
        return false;
      }

      setAddForm(prev => ({ ...prev, imageUri: downloadResult.uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Not: Add Modal, PhotoPickerModal'in onClose callback'i tarafindan acilacak
      return true;
    } catch (error) {
      console.error('URL image error:', error);
      return false;
    } finally {
      setIsUrlLoading(false);
    }
  }, []);

  const handleToggleSeason = useCallback((season: Season) => {
    setAddForm(prev => ({
      ...prev,
      season: prev.season.includes(season)
        ? prev.season.filter(s => s !== season)
        : [...prev.season, season],
    }));
  }, []);

  const handleAddItem = useCallback(async () => {
    if (!addForm.imageUri || !addForm.name || !addForm.color) {
      Alert.alert(t('common.error'), 'Lutfen tum gerekli alanlari doldurun');
      return;
    }

    setIsAdding(true);
    setAddProgress(0);

    try {
      const itemData: CreateWardrobeItemInput = {
        name: addForm.name,
        category: addForm.category,
        subcategory: addForm.subcategory || SUBCATEGORIES[addForm.category][0],
        season: addForm.season.length > 0 ? addForm.season : ['spring', 'summer', 'fall', 'winter'],
        color: addForm.color,
        colorHex: addForm.colorHex,
        brand: addForm.brand || undefined,
        notes: addForm.notes || undefined,
        tags: [],
        isFavorite: false,
      };

      await addItem(addForm.imageUri, itemData, setAddProgress);
      setShowAddModal(false);
      Alert.alert(t('common.success'), t('wardrobe.alerts.addSuccess'));
    } catch (error) {
      console.error('Add item error:', error);
      Alert.alert(t('common.error'), t('wardrobe.alerts.addError'));
    } finally {
      setIsAdding(false);
      setAddProgress(0);
    }
  }, [addForm, addItem, t]);

  const handleDeleteItem = useCallback(async () => {
    if (!selectedItem) return;

    Alert.alert(
      t('wardrobe.deleteConfirm.title'),
      t('wardrobe.deleteConfirm.message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(selectedItem.id, selectedItem.imagePath);
              setShowDetailModal(false);
              setSelectedItem(null);
            } catch (error) {
              Alert.alert(t('common.error'), 'Silme islemi basarisiz');
            }
          },
        },
      ]
    );
  }, [selectedItem, deleteItem, t]);

  const handleToggleFavorite = useCallback(async () => {
    if (!selectedItem) return;
    try {
      await toggleItemFavorite(selectedItem.id, !selectedItem.isFavorite);
      setSelectedItem((prev: any) => prev ? { ...prev, isFavorite: !prev.isFavorite } : null);
    } catch (error) {
      Alert.alert(t('common.error'), 'Islem basarisiz');
    }
  }, [selectedItem, toggleItemFavorite, t]);

  const handleRecordWear = useCallback(async () => {
    if (!selectedItem) return;
    try {
      await recordItemWear(selectedItem.id);
      setSelectedItem((prev: any) => prev ? { ...prev, wearCount: (prev.wearCount || 0) + 1 } : null);

      // Animate wear count
      wearCountScale.value = withSpring(1.3, { damping: 10 }, () => {
        wearCountScale.value = withSpring(1);
      });

      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(t('common.error'), 'Islem basarisiz');
    }
  }, [selectedItem, recordItemWear, t, wearCountScale]);

  // Animated style for wear count
  const wearCountAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: wearCountScale.value }],
    };
  });

  // Advanced Analytics Calculations
  const detailedStats = useMemo(() => {
    if (items.length === 0) return null;

    const now = new Date();
    const periodDays = statsPeriod === 'daily' ? 7 : statsPeriod === 'weekly' ? 30 : 365;
    const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Filter items by period
    const periodItems = items.filter(item =>
      item.lastWornAt && new Date(item.lastWornAt) >= periodStart
    );

    // Most & Least worn
    const sortedByWear = [...items].sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
    const mostWorn = sortedByWear[0];
    const leastWorn = sortedByWear[sortedByWear.length - 1];

    // Brand analytics
    const brandCounts: Record<string, { count: number; wears: number }> = {};
    items.forEach(item => {
      if (item.brand) {
        if (!brandCounts[item.brand]) {
          brandCounts[item.brand] = { count: 0, wears: 0 };
        }
        brandCounts[item.brand].count += 1;
        brandCounts[item.brand].wears += item.wearCount || 0;
      }
    });
    const brandStats = Object.entries(brandCounts)
      .map(([brand, data]) => ({ brand, ...data }))
      .sort((a, b) => b.wears - a.wears);

    // Color distribution
    const colorCounts: Record<string, number> = {};
    items.forEach(item => {
      if (item.color) {
        colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
      }
    });

    // Time-based analytics
    const wearsPerDay = periodItems.reduce((sum, item) => sum + (item.wearCount || 0), 0) / periodDays;
    const activeItems = items.filter(item => (item.wearCount || 0) > 0).length;
    const utilizationRate = (activeItems / items.length) * 100;

    // Wear frequency by time
    const wearsByPeriod: Record<string, number> = {};
    periodItems.forEach(item => {
      if (item.lastWornAt) {
        const date = new Date(item.lastWornAt);
        let key: string;
        if (statsPeriod === 'daily') {
          key = date.toLocaleDateString('tr-TR', { weekday: 'short' });
        } else if (statsPeriod === 'weekly') {
          const weekNum = Math.floor((now.getTime() - date.getTime()) / (7 * 24 * 60 * 60 * 1000));
          key = `${weekNum} hafta önce`;
        } else {
          key = date.toLocaleDateString('tr-TR', { month: 'short' });
        }
        wearsByPeriod[key] = (wearsByPeriod[key] || 0) + (item.wearCount || 0);
      }
    });

    return {
      mostWorn,
      leastWorn,
      brandStats,
      colorCounts,
      wearsPerDay,
      utilizationRate,
      wearsByPeriod,
      totalWears: items.reduce((sum, item) => sum + (item.wearCount || 0), 0),
      activeItems,
    };
  }, [items, statsPeriod]);

  // Modern Distribution Card Component
  const DistributionCard = ({
    label,
    value,
    percentage,
    color,
    icon,
    index = 0
  }: {
    label: string;
    value: number;
    percentage: number;
    color: string;
    icon?: string;
    index?: number;
  }) => {
    return (
      <Animated.View
        entering={FadeIn.delay(index * 50).springify()}
        style={styles.distributionCard}
      >
        <View style={styles.distributionCardHeader}>
          {icon && (
            <View style={[styles.distributionIcon, { backgroundColor: `${color}15` }]}>
              <Ionicons name={icon as any} size={20} color={color} />
            </View>
          )}
          <Text style={styles.distributionLabel}>{label}</Text>
        </View>
        <View style={styles.distributionContent}>
          <View style={styles.distributionStats}>
            <Text style={styles.distributionValue}>{value}</Text>
            <Text style={styles.distributionPercentage}>{percentage.toFixed(0)}%</Text>
          </View>
          <View style={styles.distributionBarContainer}>
            <View
              style={[
                styles.distributionBar,
                {
                  width: `${percentage}%`,
                  backgroundColor: color,
                }
              ]}
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    <Animated.View
      entering={FadeIn.delay(index * 30)}
      layout={AnimatedLayout.springify()}
      style={styles.itemWrapper}
    >
      <WardrobeItemCard
        item={item}
        onPress={() => handleItemPress(item)}
      />
    </Animated.View>
  ), [handleItemPress]);

  return (
    <SafeContainer edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('wardrobe.title')}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('common.search')}
          placeholderTextColor={Colors.text.muted}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Ionicons name="close-circle" size={20} color={Colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        stats={stats}
        onSelect={handleCategorySelect}
      />

      {/* Content */}
      <View style={styles.contentWrapper}>
        {filteredItems.length === 0 && !isLoading ? (
          <View style={styles.emptyContainer}>
            <EmptyWardrobe onAddPress={handleAddPress} />
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            numColumns={2}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            columnWrapperStyle={styles.columnWrapper}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={Colors.accent.primary}
              />
            }
          />
        )}
      </View>

      {/* FAB - Liquid Glass */}
      <TouchableOpacity style={styles.fab} onPress={handleAddPress} activeOpacity={0.8}>
        <BlurView intensity={50} tint="light" style={styles.fabBlur}>
          <View style={styles.fabGlass} />
          <View style={styles.fabHighlight} />
          <Ionicons name="add" size={26} color={Colors.text.primary} />
        </BlurView>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeContainer edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('wardrobe.addItem')}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Image Picker */}
            <TouchableOpacity style={styles.imagePicker} onPress={handleOpenPhotoPicker}>
              {addForm.imageUri ? (
                <Image source={{ uri: addForm.imageUri }} style={styles.selectedImage} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={40} color={Colors.text.muted} />
                  <Text style={styles.imagePickerText}>{t('wardrobe.form.selectImage')}</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Name */}
            <Text style={styles.label}>{t('wardrobe.form.name')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('wardrobe.form.namePlaceholder')}
              placeholderTextColor={Colors.text.muted}
              value={addForm.name}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, name: text }))}
            />

            {/* Category */}
            <Text style={styles.label}>{t('wardrobe.form.category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    addForm.category === cat && { backgroundColor: CategoryColors[cat] },
                  ]}
                  onPress={() => setAddForm(prev => ({ ...prev, category: cat, subcategory: '' }))}
                >
                  <Text style={[
                    styles.categoryChipText,
                    addForm.category === cat && { color: Colors.text.white },
                  ]}>
                    {t(`wardrobe.categories.${cat}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Season */}
            <Text style={styles.label}>{t('wardrobe.form.season')}</Text>
            <View style={styles.seasonRow}>
              {SEASONS.map(season => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.seasonChip,
                    addForm.season.includes(season) && { backgroundColor: SeasonColors[season] },
                  ]}
                  onPress={() => handleToggleSeason(season)}
                >
                  <Text style={[
                    styles.seasonChipText,
                    addForm.season.includes(season) && { color: Colors.text.white },
                  ]}>
                    {t(`wardrobe.seasons.${season}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Color */}
            <Text style={styles.label}>{t('wardrobe.form.color')}</Text>
            <TextInput
              style={styles.input}
              placeholder="Siyah, Beyaz, Mavi..."
              placeholderTextColor={Colors.text.muted}
              value={addForm.color}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, color: text }))}
            />

            {/* Brand (optional) */}
            <Text style={styles.label}>{t('wardrobe.form.brand')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('wardrobe.form.brandPlaceholder')}
              placeholderTextColor={Colors.text.muted}
              value={addForm.brand}
              onChangeText={(text) => setAddForm(prev => ({ ...prev, brand: text }))}
            />

            {/* Progress */}
            {isAdding && (
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${addProgress}%` }]} />
                <Text style={styles.progressText}>{Math.round(addProgress)}%</Text>
              </View>
            )}

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.modalFooter}>
            <Button
              title={isAdding ? `${Math.round(addProgress)}%` : t('common.save')}
              onPress={handleAddItem}
              fullWidth
              size="lg"
              disabled={isAdding || !addForm.imageUri || !addForm.name}
            />
          </View>
        </SafeContainer>
      </Modal>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedItem && (
          <SafeContainer edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{selectedItem.name}</Text>
              <TouchableOpacity onPress={handleDeleteItem}>
                <Ionicons name="trash-outline" size={24} color={Colors.accent.error} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Image
                source={{ uri: selectedItem.imageUrl }}
                style={styles.detailImage}
                resizeMode="cover"
              />

              <View style={styles.detailInfo}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('wardrobe.form.category')}</Text>
                  <Text style={styles.detailValue}>{t(`wardrobe.categories.${selectedItem.category}`)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('wardrobe.form.color')}</Text>
                  <View style={styles.colorValue}>
                    <View style={[styles.colorDot, { backgroundColor: selectedItem.colorHex }]} />
                    <Text style={styles.detailValue}>{selectedItem.color}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{t('wardrobe.detail.wearCount')}</Text>
                  <Animated.Text style={[styles.detailValue, wearCountAnimatedStyle]}>
                    {selectedItem.wearCount || 0}
                  </Animated.Text>
                </View>

                {selectedItem.brand && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>{t('wardrobe.form.brand')}</Text>
                    <Text style={styles.detailValue}>{selectedItem.brand}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <View style={styles.actionButtonWrapper}>
                  <Button
                    title={t('wardrobe.detail.favorite', { defaultValue: 'Favori' })}
                    onPress={handleToggleFavorite}
                    variant={selectedItem.isFavorite ? 'outline' : 'secondary'}
                    size="md"
                    fullWidth
                    icon={<Ionicons name={selectedItem.isFavorite ? 'heart' : 'heart-outline'} size={18} color={selectedItem.isFavorite ? Colors.accent.error : Colors.accent.primary} />}
                  />
                </View>
                <View style={styles.actionButtonWrapper}>
                  <Button
                    title={t('wardrobe.detail.recordWear')}
                    onPress={handleRecordWear}
                    variant="primary"
                    size="md"
                    fullWidth
                    icon={<Ionicons name="checkmark-circle-outline" size={18} color={Colors.text.white} />}
                  />
                </View>
              </View>
            </ScrollView>
          </SafeContainer>
        )}
      </Modal>

      {/* Photo Picker Modal - Outside all other modals */}
      <PhotoPickerModal
        visible={showPhotoPickerModal}
        onClose={() => {
          setShowPhotoPickerModal(false);
          // Kullanici modal'i kapatti, Add Modal'i tekrar ac
          setShowAddModal(true);
        }}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
        onUrlSubmit={handleUrlSubmit}
        title={t('photoPickerModal.title')}
        showUrlOption={true}
        urlLoading={isUrlLoading}
      />

      {/* Statistics Modal */}
      <Modal
        visible={showStatsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatsModal(false)}
      >
        <SafeContainer edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatsModal(false)}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Analytics Dashboard</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Period Selector */}
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[styles.periodButton, statsPeriod === 'daily' && styles.periodButtonActive]}
              onPress={() => setStatsPeriod('daily')}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, statsPeriod === 'daily' && styles.periodButtonTextActive]}>
                Günlük
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, statsPeriod === 'weekly' && styles.periodButtonActive]}
              onPress={() => setStatsPeriod('weekly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, statsPeriod === 'weekly' && styles.periodButtonTextActive]}>
                Haftalık
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.periodButton, statsPeriod === 'monthly' && styles.periodButtonActive]}
              onPress={() => setStatsPeriod('monthly')}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodButtonText, statsPeriod === 'monthly' && styles.periodButtonTextActive]}>
                Aylık
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {detailedStats && (
              <>
                {/* KPI Cards */}
                <View style={styles.kpiSection}>
                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#667EEA15' }]}>
                      <Ionicons name="stats-chart" size={20} color="#667EEA" />
                    </View>
                    <Text style={styles.kpiLabel}>Kullanım Oranı</Text>
                    <Text style={[styles.kpiValue, { color: '#667EEA' }]}>
                      {detailedStats.utilizationRate.toFixed(0)}%
                    </Text>
                    <Text style={styles.kpiSubtext}>
                      {detailedStats.activeItems}/{stats?.total || 0} aktif
                    </Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#FF6B6B15' }]}>
                      <Ionicons name="flame" size={20} color="#FF6B6B" />
                    </View>
                    <Text style={styles.kpiLabel}>Ort. Giyilme</Text>
                    <Text style={[styles.kpiValue, { color: '#FF6B6B' }]}>
                      {detailedStats.wearsPerDay.toFixed(1)}
                    </Text>
                    <Text style={styles.kpiSubtext}>
                      /gün
                    </Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={[styles.kpiIcon, { backgroundColor: '#4ECDC415' }]}>
                      <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    </View>
                    <Text style={styles.kpiLabel}>Aktif Parça</Text>
                    <Text style={[styles.kpiValue, { color: '#4ECDC4' }]}>
                      {detailedStats.activeItems}
                    </Text>
                    <Text style={styles.kpiSubtext}>
                      kıyafet
                    </Text>
                  </View>
                </View>

                {/* Most Worn Item */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>
                    {t('wardrobe.stats.mostWorn', { defaultValue: 'En Çok Giyilen' })}
                  </Text>
                  <View style={[styles.distributionCard, { borderLeftColor: '#FF6B6B', borderLeftWidth: 4 }]}>
                    <View style={styles.distributionCardHeader}>
                      <View style={[styles.distributionIcon, { backgroundColor: '#FF6B6B15' }]}>
                        <Ionicons name="trophy" size={20} color="#FF6B6B" />
                      </View>
                      <Text style={styles.distributionLabel}>{detailedStats.mostWorn.name}</Text>
                    </View>
                    <View style={styles.distributionStats}>
                      <Text style={[styles.distributionValue, { color: '#FF6B6B' }]}>
                        {detailedStats.mostWorn.wearCount || 0}
                      </Text>
                      <Text style={styles.distributionPercentage}>
                        {t('wardrobe.stats.times', { defaultValue: 'kez' })}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Season Distribution */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>
                    {t('wardrobe.stats.seasonDistribution', { defaultValue: 'Mevsim Dağılımı' })}
                  </Text>
                  <View style={styles.distributionGrid}>
                    {stats && Object.entries(stats.bySeason)
                      .filter(([_, count]) => count > 0)
                      .map(([season, count], idx) => {
                        const seasonColors: Record<string, string> = {
                          summer: '#FF6B6B',
                          winter: '#4ECDC4',
                          spring: '#95E1D3',
                          fall: '#F38181',
                        };
                        const seasonIcons: Record<string, string> = {
                          summer: 'sunny',
                          winter: 'snow',
                          spring: 'flower',
                          fall: 'leaf',
                        };
                        return (
                          <DistributionCard
                            key={season}
                            label={t(`wardrobe.seasons.${season}`)}
                            value={count}
                            percentage={(count / stats.total) * 100}
                            color={seasonColors[season] || '#6C5CE7'}
                            icon={seasonIcons[season]}
                            index={idx}
                          />
                        );
                      })}
                  </View>
                </View>

                {/* Category Distribution */}
                <View style={styles.statSection}>
                  <Text style={styles.statSectionTitle}>
                    {t('wardrobe.stats.categoryDistribution', { defaultValue: 'Kategori Dağılımı' })}
                  </Text>
                  <View style={styles.distributionGrid}>
                    {stats && Object.entries(stats.byCategory)
                      .filter(([_, count]) => count > 0)
                      .map(([category, count], idx) => {
                        const categoryColors: Record<string, string> = {
                          tops: '#6C5CE7',
                          bottoms: '#00B894',
                          dresses: '#FD79A8',
                          outerwear: '#74B9FF',
                          shoes: '#FDCB6E',
                          accessories: '#A29BFE',
                        };
                        const categoryIcons: Record<string, string> = {
                          tops: 'shirt',
                          bottoms: 'fitness',
                          dresses: 'woman',
                          outerwear: 'snow',
                          shoes: 'footsteps',
                          accessories: 'watch',
                        };
                        return (
                          <DistributionCard
                            key={category}
                            label={t(`wardrobe.categories.${category}`)}
                            value={count}
                            percentage={(count / stats.total) * 100}
                            color={categoryColors[category] || '#6C5CE7'}
                            icon={categoryIcons[category]}
                            index={idx}
                          />
                        );
                      })}
                  </View>
                </View>

                {/* Top Brand */}
                {detailedStats.brandStats.length > 0 && (
                  <View style={styles.statSection}>
                    <Text style={styles.statSectionTitle}>
                      {t('wardrobe.stats.topBrand', { defaultValue: 'En Çok Kullanılan Marka' })}
                    </Text>
                    <View style={[styles.distributionCard, { borderLeftColor: '#4FACFE', borderLeftWidth: 4 }]}>
                      <View style={styles.distributionCardHeader}>
                        <View style={[styles.distributionIcon, { backgroundColor: '#4FACFE15' }]}>
                          <Ionicons name="pricetag" size={20} color="#4FACFE" />
                        </View>
                        <Text style={styles.distributionLabel}>{detailedStats.brandStats[0].brand}</Text>
                      </View>
                      <View style={styles.distributionStats}>
                        <Text style={[styles.distributionValue, { color: '#4FACFE' }]}>
                          {detailedStats.brandStats[0].count}
                        </Text>
                        <Text style={styles.distributionPercentage}>
                          {detailedStats.brandStats[0].wears} {t('wardrobe.stats.times', { defaultValue: 'kez' })}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Total Stats */}
                <View style={styles.statSection}>
                  <View style={styles.totalStatsRow}>
                    <View style={[styles.totalStatCard, { borderLeftColor: '#667EEA', borderLeftWidth: 4 }]}>
                      <View style={[styles.distributionIcon, { backgroundColor: '#667EEA15' }]}>
                        <Ionicons name="shirt" size={24} color="#667EEA" />
                      </View>
                      <Text style={[styles.totalStatValue, { color: '#667EEA' }]}>{stats?.total || 0}</Text>
                      <Text style={styles.totalStatLabel}>
                        {t('wardrobe.stats.totalItems', { defaultValue: 'Toplam Kıyafet' })}
                      </Text>
                    </View>
                    <View style={[styles.totalStatCard, { borderLeftColor: '#FA709A', borderLeftWidth: 4 }]}>
                      <View style={[styles.distributionIcon, { backgroundColor: '#FA709A15' }]}>
                        <Ionicons name="sparkles" size={24} color="#FA709A" />
                      </View>
                      <Text style={[styles.totalStatValue, { color: '#FA709A' }]}>{detailedStats.totalWears}</Text>
                      <Text style={styles.totalStatLabel}>
                        {t('wardrobe.stats.totalWears', { defaultValue: 'Toplam Giyilme' })}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}

            {!detailedStats && (
              <View style={styles.emptyStats}>
                <Ionicons name="analytics-outline" size={64} color={Colors.text.muted} />
                <Text style={styles.emptyStatsText}>
                  {t('wardrobe.stats.empty', { defaultValue: 'Henüz istatistik yok' })}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeContainer>
      </Modal>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.h2,
    color: Colors.text.primary,
  },
  contentWrapper: {
    flex: 1,
    ...Platform.select({
      ios: {
      justifyContent: 'flex-start',
      top: hp('-25%'),
      },
      android: {
        justifyContent: 'flex-start',
        top: hp('-25%'),
      },
    }),
    zIndex: 999999999,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        justifyContent: 'flex-start',
        paddingTop: hp('10%'),
      },
      android: {
        justifyContent: 'flex-start',
        paddingTop: hp('10%'),
      },
    }),
  },
  statsButton: {
    width: wp('12%'),
    height: wp('12%'),
    borderRadius: wp('6%'),
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    ...Shadows.md,
  },
  addButton: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('5%'),
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    ...Shadows.md,
  },
  addButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: hp('15%'),
    ...Platform.select({
      ios: {
        paddingTop: 4,
      },
      android: {
        paddingTop: Spacing.sm,
      },
    }),
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  itemWrapper: {
    flex: 1,
    maxWidth: '50%',
    marginBottom: Spacing.md,
  },
  fab: {
    position: 'absolute',
    bottom: hp('12%'),
    right: Spacing.base,
    width: wp('14%'),
    height: wp('14%'),
    borderRadius: wp('7%'),
    overflow: 'hidden',
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    ...Shadows.lg,
  },
  fabBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabGlass: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.9)',
  },
  fabHighlight: {
    position: 'absolute',
    top: 0,
    left: wp('2.5%'),
    right: wp('2.5%'),
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  // Modal styles
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.base,
  },
  modalFooter: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  imagePicker: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: wp('4%'),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: wp('0.5%'),
    borderColor: Colors.border.light,
    borderStyle: 'dashed',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
  },
  imagePickerText: {
    ...Typography.body,
    color: Colors.text.muted,
    marginTop: Spacing.sm,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text.primary,
  },
  chipScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background.secondary,
    marginRight: Spacing.sm,
  },
  categoryChipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  seasonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  seasonChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
  },
  seasonChipText: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  progressContainer: {
    marginTop: Spacing.lg,
    height: hp('0.75%'),
    backgroundColor: Colors.background.secondary,
    borderRadius: wp('0.75%'),
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.text.muted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  // Detail modal
  detailImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  detailInfo: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
  },
  detailValue: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  colorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: wp('4%'),
    height: wp('4%'),
    borderRadius: wp('2%'),
    borderWidth: wp('0.25%'),
    borderColor: Colors.border.light,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButtonWrapper: {
    flex: 1,
  },
  // Stats Modal Styles
  statSection: {
    marginBottom: Spacing.xl,
  },
  statSectionTitle: {
    ...Typography.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  distributionGrid: {
    gap: Spacing.md,
  },
  distributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  distributionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  distributionIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  distributionLabel: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  distributionContent: {
    gap: Spacing.sm,
  },
  distributionStats: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  distributionValue: {
    ...Typography.h2,
    color: Colors.text.primary,
    fontWeight: '700',
  },
  distributionPercentage: {
    ...Typography.body,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  distributionBarContainer: {
    height: hp('1%'),
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  distributionBar: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  statCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardTitle: {
    ...Typography.body,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  statCardValue: {
    ...Typography.h3,
    color: Colors.accent.primary,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  statRowLabel: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    width: wp('25%'),
  },
  statRowBar: {
    flex: 1,
    height: hp('1.5%'),
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  statRowBarFill: {
    height: '100%',
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.full,
  },
  statRowValue: {
    ...Typography.bodySmall,
    color: Colors.text.primary,
    fontWeight: '600',
    width: wp('10%'),
    textAlign: 'right',
  },
  totalStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  totalStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp('4%'),
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  totalStatValue: {
    ...Typography.h1,
    fontWeight: '800',
  },
  totalStatLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  emptyStats: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp('10%'),
  },
  // Period Selector Styles
  periodSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  periodButtonActive: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  periodButtonText: {
    ...Typography.bodySmall,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: Colors.text.white,
  },
  // KPI Cards Styles
  kpiSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp('3%'),
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  kpiIcon: {
    width: wp('10%'),
    height: wp('10%'),
    borderRadius: wp('2.5%'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  kpiLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  kpiValue: {
    ...Typography.h2,
    fontWeight: '800',
    marginBottom: 2,
  },
  kpiSubtext: {
    ...Typography.caption,
    color: Colors.text.muted,
    fontSize: 10,
  },
  emptyStatsText: {
    ...Typography.body,
    color: Colors.text.muted,
    marginTop: Spacing.md,
  },
});
