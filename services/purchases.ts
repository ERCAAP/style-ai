import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { trackPurchase as trackReferralPurchase } from './firebase/analytics';

// RevenueCat API Keys
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Entitlement identifier - RevenueCat dashboard'da tanimladiginiz
const PRO_ENTITLEMENT = 'pro';

class PurchasesService {
  private initialized = false;

  async initialize(userId?: string): Promise<void> {
    if (this.initialized) return;

    const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

    if (!apiKey) {
      console.warn('RevenueCat API key not configured');
      return;
    }

    try {
      await Purchases.configure({ apiKey });

      if (userId) {
        await Purchases.logIn(userId);
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Failed to get offerings:', error);
      return null;
    }
  }

  async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);

      // Track referral purchase
      try {
        const referrer = await AsyncStorage.getItem('@boho_referrer');
        const userId = await AsyncStorage.getItem('@boho_user_id');

        if (referrer && userId) {
          // Get product details from package
          const amount = pkg.product.price;
          const productIdentifier = pkg.product.identifier;
          const packageType = pkg.identifier; // e.g., 'weekly', 'monthly', 'annual'

          await trackReferralPurchase(
            referrer,
            userId,
            amount,
            Platform.OS as 'ios' | 'android',
            productIdentifier,
            packageType
          );

          console.log('✅ Purchase tracked:', {
            referrer,
            amount,
            package: packageType,
            product: productIdentifier,
          });
        }
      } catch (trackError) {
        console.warn('Failed to track purchase:', trackError);
        // Don't throw - purchase was successful, tracking is secondary
      }

      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        // Kullanici iptali - normal durum
        return null;
      }
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (error) {
      console.error('Restore failed:', error);
      throw error;
    }
  }

  async checkProStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[PRO_ENTITLEMENT] !== undefined;
    } catch (error) {
      console.error('Failed to check pro status:', error);
      return false;
    }
  }

  // RevenueCat remote paywall'i goster
  async presentPaywall(): Promise<{
    purchased: boolean;
    restored: boolean;
    cancelled: boolean;
  }> {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: PRO_ENTITLEMENT,
      });

      return {
        purchased: result === PAYWALL_RESULT.PURCHASED,
        restored: result === PAYWALL_RESULT.RESTORED,
        cancelled: result === PAYWALL_RESULT.CANCELLED || result === PAYWALL_RESULT.NOT_PRESENTED,
      };
    } catch (error) {
      console.error('Failed to present paywall:', error);
      return { purchased: false, restored: false, cancelled: true };
    }
  }

  // Belirli bir offering ile paywall goster
  async presentPaywallForOffering(offeringIdentifier: string): Promise<{
    purchased: boolean;
    restored: boolean;
    cancelled: boolean;
  }> {
    try {
      const offerings = await Purchases.getOfferings();
      const offering = offerings.all[offeringIdentifier];

      if (!offering) {
        console.error(`Offering ${offeringIdentifier} not found`);
        return { purchased: false, restored: false, cancelled: true };
      }

      const result = await RevenueCatUI.presentPaywall({
        offering,
      });

      return {
        purchased: result === PAYWALL_RESULT.PURCHASED,
        restored: result === PAYWALL_RESULT.RESTORED,
        cancelled: result === PAYWALL_RESULT.CANCELLED,
      };
    } catch (error) {
      console.error('Failed to present paywall for offering:', error);
      return { purchased: false, restored: false, cancelled: true };
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Failed to get customer info:', error);
      return null;
    }
  }

  // Kullanici giris yaptiginda cagirin
  async login(userId: string): Promise<void> {
    try {
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('Failed to login to RevenueCat:', error);
    }
  }

  // Kullanici cikis yaptiginda cagirin
  async logout(): Promise<void> {
    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('Failed to logout from RevenueCat:', error);
    }
  }
}

export const purchasesService = new PurchasesService();
export { PAYWALL_RESULT };
export type { PurchasesPackage, CustomerInfo, PurchasesOffering };
