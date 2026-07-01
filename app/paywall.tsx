import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import RevenueCatUI from 'react-native-purchases-ui';
import Purchases from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing } from '@/constants/theme';
import { useReferral, useAuthContext } from '@/contexts';
import { trackPurchase as trackReferralPurchase } from '@/services/firebase/analytics';
import { updateSubscriptionStatus } from '@/services/firebase/auth';

const DEFAULT_OFFERING_ID = 'mira_model_test';

export default function PaywallScreen() {
  const router = useRouter();
  const { referrer } = useReferral();
  const { user, refreshProfile } = useAuthContext();
  const { t } = useTranslation();
  const [offering, setOffering] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paywallOpenTime] = useState(Date.now());
  const loadingProgress = useRef(new Animated.Value(0)).current;
  const [isCloseEnabled, setIsCloseEnabled] = useState(false);

  useEffect(() => {
    loadOffering();

    // Track paywall opened
    console.log('📊 Paywall opened', {
      referrer,
      offering: DEFAULT_OFFERING_ID,
      time: new Date().toISOString()
    });

    // Animate loading bar from 0 to 1 over 5 seconds (visual only)
    Animated.timing(loadingProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => {
      setIsCloseEnabled(true);
    });
  }, [referrer]);

  const loadOffering = async () => {
    try {
      // Check if RevenueCat is configured
      const apiKey = Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

      if (!apiKey) {
        console.log('RevenueCat not configured - skipping paywall');
        setIsLoading(false);
        // Close paywall immediately if not configured
        router.back();
        return;
      }

      const offerings = await Purchases.getOfferings();

      // Try to get the default offering (mira_model_test)
      let selectedOffering = offerings.all[DEFAULT_OFFERING_ID];

      // Fallback to current offering if default not found
      if (!selectedOffering && offerings.current) {
        selectedOffering = offerings.current;
        console.log('Default offering not found, using current:', offerings.current?.identifier);
      }

      if (selectedOffering) {
        setOffering(selectedOffering);
        console.log('Selected offering:', selectedOffering.identifier);
      } else {
        console.error(`Offering '${DEFAULT_OFFERING_ID}' not found`);
      }
    } catch (error) {
      console.error('Failed to load offering:', error);
      // Close paywall on error
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchaseCompleted = useCallback(async ({ customerInfo }: { customerInfo: any }) => {
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;

    if (isPro) {
      // Track purchase completion
      try {
        // Get latest transaction info
        const transactions = customerInfo.nonSubscriptionTransactions || [];
        const latestTransaction = transactions[transactions.length - 1];

        if (latestTransaction) {
          const referrerUsername = await AsyncStorage.getItem('@boho_referrer');
          const userId = await AsyncStorage.getItem('@boho_user_id');

          if (referrerUsername && userId) {
            const amount = latestTransaction.price || 0;
            const productIdentifier = latestTransaction.productIdentifier || 'unknown';

            await trackReferralPurchase(
              referrerUsername,
              userId,
              amount,
              Platform.OS as 'ios' | 'android',
              productIdentifier,
              'paywall'
            );

            console.log('✅ Paywall purchase tracked:', {
              referrer: referrerUsername,
              amount,
              product: productIdentifier,
            });
          }
        }

        const timeSpent = Math.round((Date.now() - paywallOpenTime) / 1000);
        console.log('📊 Purchase completed via paywall', {
          timeSpent: `${timeSpent}s`,
          referrer,
          offering: DEFAULT_OFFERING_ID,
        });
      } catch (error) {
        console.warn('Failed to track paywall purchase:', error);
      }

      // CRITICAL: Sync subscription status to Firestore
      try {
        if (user?.uid) {
          // Get product identifier from latest transaction or subscription
          const activeSubscription = Object.values(customerInfo.entitlements.active)[0] as any;
          const productId = activeSubscription?.productIdentifier || 'pro';

          // Update Firestore with active subscription
          await updateSubscriptionStatus(user.uid, 'active', productId);
          console.log('✅ Subscription synced to Firestore');

          // Refresh profile to update context
          await refreshProfile();
          console.log('✅ Profile refreshed');
        }
      } catch (error) {
        console.error('❌ Failed to sync subscription to Firestore:', error);
      }

      router.back();
    }
  }, [router, referrer, paywallOpenTime, user, refreshProfile]);

  const handleRestoreCompleted = useCallback(async ({ customerInfo }: { customerInfo: any }) => {
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    if (isPro) {
      // Sync subscription status to Firestore after restore
      try {
        if (user?.uid) {
          const activeSubscription = Object.values(customerInfo.entitlements.active)[0] as any;
          const productId = activeSubscription?.productIdentifier || 'pro';

          await updateSubscriptionStatus(user.uid, 'active', productId);
          console.log('✅ Restored subscription synced to Firestore');

          await refreshProfile();
          console.log('✅ Profile refreshed after restore');
        }
      } catch (error) {
        console.error('❌ Failed to sync restored subscription:', error);
      }

      router.back();
    }
  }, [router, user, refreshProfile]);

  const handleDismiss = useCallback(async () => {
    const timeSpent = Math.round((Date.now() - paywallOpenTime) / 1000);
    console.log('📊 Paywall dismissed', {
      timeSpent: `${timeSpent}s`,
      referrer,
      offering: DEFAULT_OFFERING_ID,
    });

    router.back();
  }, [router, referrer, paywallOpenTime]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!offering) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t('paywall.error')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <RevenueCatUI.Paywall
        options={{ offering: offering! }}
        onPurchaseCompleted={handlePurchaseCompleted}
        onRestoreCompleted={handleRestoreCompleted}
        onDismiss={handleDismiss}
      />
      <View style={styles.closeButton}>
        <TouchableOpacity
          onPress={handleDismiss}
          style={[
            styles.closeButtonTouchable,
            !isCloseEnabled && styles.closeButtonDisabled
          ]}
          activeOpacity={0.7}
          disabled={!isCloseEnabled}
        >
          <Svg
            width={wp('8%')}
            height={wp('8%')}
            style={StyleSheet.absoluteFill}
          >
            <Circle
              cx={wp('4%')}
              cy={wp('4%')}
              r={wp('3%')}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={2}
              fill="none"
            />
            <AnimatedCircle
              cx={wp('4%')}
              cy={wp('4%')}
              r={wp('3%')}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth={2}
              fill="none"
              strokeDasharray={75.4}
              strokeDashoffset={loadingProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [75.4, 0],
              })}
              strokeLinecap="round"
              transform={`rotate(-90 ${wp('4%')} ${wp('4%')})`}
            />
          </Svg>
          <Ionicons
            name="close"
            size={wp('5%')}
            color="rgba(255, 255, 255, 0.6)"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.start,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorText: {
    ...Typography.body,
    color: Colors.text.secondary,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('8%') : hp('4%'),
    right: wp('5%'),
    zIndex: 1000,
  },
  closeButtonTouchable: {
    width: wp('8%'),
    height: wp('8%'),
    borderRadius: wp('4%'),
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  closeButtonDisabled: {
    opacity: 0.5,
  },
});
