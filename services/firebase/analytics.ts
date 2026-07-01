import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  query,
  where,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

/**
 * Firebase Analytics Service for Referral Tracking
 *
 * Collections Structure:
 *
 * 1. users/{userId}
 *    - username: string
 *    - referralCode: string (unique)
 *    - createdAt: Timestamp
 *    - totalReferrals: number
 *    - totalPurchases: number
 *    - totalAnalyses: number
 *
 * 2. referralEvents/{eventId}
 *    - referrerId: string (user who shared link)
 *    - referredUserId: string (new user)
 *    - eventType: 'app_install' | 'app_open' | 'purchase' | 'analysis'
 *    - timestamp: Timestamp
 *    - platform: 'ios' | 'android' | 'web'
 *    - metadata: object
 *
 * 3. userAnalytics/{userId}
 *    - userId: string
 *    - referrals: { installCount, openCount, purchaseCount, analysisCount }
 *    - lastUpdated: Timestamp
 *    - revenue: number (from purchases)
 */

// Collection names
const COLLECTIONS = {
  USERS: 'users',
  REFERRAL_EVENTS: 'referralEvents',
  USER_ANALYTICS: 'userAnalytics',
  DEEPLINK_TRACKING: 'deeplinkTracking',
};

export interface User {
  userId: string;
  username: string;
  referralCode: string;
  createdAt: Timestamp;
  totalReferrals: number;
  totalPurchases: number;
  totalAnalyses: number;
  email?: string;
  deviceId?: string;
}

export interface ReferralEvent {
  eventId: string;
  referrerId: string; // username of referrer
  referredUserId: string; // device ID or user ID
  eventType: 'app_install' | 'app_open' | 'purchase' | 'analysis';
  timestamp: Timestamp;
  platform: 'ios' | 'android' | 'web';
  metadata?: {
    amount?: number; // for purchases
    analysisType?: string; // for analyses
    fromUrl?: string;
    userAgent?: string;
    productIdentifier?: string; // for purchases
    packageType?: string; // for purchases
  };
}

export interface UserAnalytics {
  userId: string;
  username: string;
  referrals: {
    installCount: number;
    openCount: number;
    purchaseCount: number;
    analysisCount: number;
  };
  revenue: number;
  lastUpdated: Timestamp;
  topReferredUsers: string[]; // top 10 referred user IDs
}

export interface DeeplinkTracking {
  trackingId: string;
  referrer: string; // username
  clickedAt: Timestamp;
  platform: 'ios' | 'android' | 'web';
  converted: boolean; // did they install?
  convertedAt?: Timestamp;
  conversionMethod?: 'direct' | 'clipboard' | 'fingerprint'; // how was attribution done
  userAgent?: string;
  ipAddress?: string; // for fraud detection
  deviceFingerprint?: string; // for deferred deep linking
  screenResolution?: string;
  timezone?: string;
  language?: string;
  devicePlatform?: string;
}

/**
 * Create or get user profile
 */
export async function getOrCreateUser(
  userId: string,
  username: string,
  email?: string
): Promise<User> {
  const userRef = doc(db, COLLECTIONS.USERS, userId);
  const userDoc = await getDoc(userRef);

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  // Create new user
  const newUser: User = {
    userId,
    username: username.toLowerCase().trim(),
    referralCode: username.toLowerCase().trim(), // username is the referral code
    createdAt: serverTimestamp() as Timestamp,
    totalReferrals: 0,
    totalPurchases: 0,
    totalAnalyses: 0,
    email,
  };

  await setDoc(userRef, newUser);

  // Initialize analytics
  await initializeUserAnalytics(userId, username);

  return newUser;
}

/**
 * Initialize user analytics document
 */
async function initializeUserAnalytics(
  userId: string,
  username: string
): Promise<void> {
  const analyticsRef = doc(db, COLLECTIONS.USER_ANALYTICS, userId);

  const analytics: UserAnalytics = {
    userId,
    username: username.toLowerCase().trim(),
    referrals: {
      installCount: 0,
      openCount: 0,
      purchaseCount: 0,
      analysisCount: 0,
    },
    revenue: 0,
    lastUpdated: serverTimestamp() as Timestamp,
    topReferredUsers: [],
  };

  await setDoc(analyticsRef, analytics);
}

/**
 * Track deeplink click
 */
export async function trackDeeplinkClick(
  referrerUsername: string,
  platform: 'ios' | 'android' | 'web',
  userAgent?: string
): Promise<string> {
  const trackingId = `${referrerUsername}_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  const trackingRef = doc(db, COLLECTIONS.DEEPLINK_TRACKING, trackingId);

  const tracking: DeeplinkTracking = {
    trackingId,
    referrer: referrerUsername.toLowerCase().trim(),
    clickedAt: serverTimestamp() as Timestamp,
    platform,
    converted: false,
    userAgent,
  };

  await setDoc(trackingRef, tracking);

  return trackingId;
}

/**
 * Track app install from referral
 */
export async function trackAppInstall(
  referrerUsername: string,
  newUserId: string,
  platform: 'ios' | 'android',
  trackingId?: string
): Promise<void> {
  const referrerCleaned = referrerUsername.toLowerCase().trim();

  // 1. Create referral event
  const eventId = `install_${referrerCleaned}_${newUserId}_${Date.now()}`;
  const eventRef = doc(db, COLLECTIONS.REFERRAL_EVENTS, eventId);

  const event: ReferralEvent = {
    eventId,
    referrerId: referrerCleaned,
    referredUserId: newUserId,
    eventType: 'app_install',
    timestamp: serverTimestamp() as Timestamp,
    platform,
    metadata: {
      fromUrl: `https://bohoapp.online/user?user=${referrerCleaned}`,
    },
  };

  await setDoc(eventRef, event);

  // 2. Update referrer analytics
  await updateReferrerAnalytics(referrerCleaned, 'installCount');

  // 3. Mark deeplink as converted (direct deeplink)
  if (trackingId) {
    const trackingRef = doc(db, COLLECTIONS.DEEPLINK_TRACKING, trackingId);
    await updateDoc(trackingRef, {
      converted: true,
      convertedAt: serverTimestamp(),
      conversionMethod: 'direct', // Direct deeplink (not deferred)
    });
  }

  console.log(`📊 Tracked app install: ${referrerCleaned} → ${newUserId}`);
}

/**
 * Track app open from deeplink
 */
export async function trackAppOpen(
  referrerUsername: string,
  userId: string,
  platform: 'ios' | 'android'
): Promise<void> {
  const referrerCleaned = referrerUsername.toLowerCase().trim();

  const eventId = `open_${referrerCleaned}_${userId}_${Date.now()}`;
  const eventRef = doc(db, COLLECTIONS.REFERRAL_EVENTS, eventId);

  const event: ReferralEvent = {
    eventId,
    referrerId: referrerCleaned,
    referredUserId: userId,
    eventType: 'app_open',
    timestamp: serverTimestamp() as Timestamp,
    platform,
  };

  await setDoc(eventRef, event);

  await updateReferrerAnalytics(referrerCleaned, 'openCount');

  console.log(`📊 Tracked app open: ${referrerCleaned} → ${userId}`);
}

/**
 * Track purchase
 */
export async function trackPurchase(
  referrerUsername: string | null,
  userId: string,
  amount: number,
  platform: 'ios' | 'android',
  productIdentifier?: string,
  packageType?: string
): Promise<void> {
  if (!referrerUsername) return;

  const referrerCleaned = referrerUsername.toLowerCase().trim();

  const eventId = `purchase_${referrerCleaned}_${userId}_${Date.now()}`;
  const eventRef = doc(db, COLLECTIONS.REFERRAL_EVENTS, eventId);

  const event: ReferralEvent = {
    eventId,
    referrerId: referrerCleaned,
    referredUserId: userId,
    eventType: 'purchase',
    timestamp: serverTimestamp() as Timestamp,
    platform,
    metadata: {
      amount,
      productIdentifier: productIdentifier || 'unknown',
      packageType: packageType || 'unknown',
    },
  };

  await setDoc(eventRef, event);

  // Update analytics
  await updateReferrerAnalytics(referrerCleaned, 'purchaseCount', amount);

  console.log(
    `📊 Tracked purchase: ${referrerCleaned} → ${userId} ($${amount})`
  );
}

/**
 * Track outfit analysis
 */
export async function trackAnalysis(
  referrerUsername: string | null,
  userId: string,
  analysisType: string,
  platform: 'ios' | 'android'
): Promise<void> {
  if (!referrerUsername) return;

  const referrerCleaned = referrerUsername.toLowerCase().trim();

  const eventId = `analysis_${referrerCleaned}_${userId}_${Date.now()}`;
  const eventRef = doc(db, COLLECTIONS.REFERRAL_EVENTS, eventId);

  const event: ReferralEvent = {
    eventId,
    referrerId: referrerCleaned,
    referredUserId: userId,
    eventType: 'analysis',
    timestamp: serverTimestamp() as Timestamp,
    platform,
    metadata: {
      analysisType,
    },
  };

  await setDoc(eventRef, event);

  await updateReferrerAnalytics(referrerCleaned, 'analysisCount');

  console.log(
    `📊 Tracked analysis: ${referrerCleaned} → ${userId} (${analysisType})`
  );
}

/**
 * Update referrer analytics
 */
async function updateReferrerAnalytics(
  referrerUsername: string,
  metric: 'installCount' | 'openCount' | 'purchaseCount' | 'analysisCount',
  revenue?: number
): Promise<void> {
  // Find user by username
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('referralCode', '==', referrerUsername));
  const querySnapshot = await getDocs(q);

  let userId: string;

  if (querySnapshot.empty) {
    // ✅ AUTO-CREATE: Referrer user doesn't exist yet, create placeholder
    console.log(`🆕 Auto-creating referrer user: ${referrerUsername}`);

    // Generate a unique userId for this username
    userId = `referrer_${referrerUsername}_${Date.now()}`;

    const newUser: User = {
      userId,
      username: referrerUsername.toLowerCase().trim(),
      referralCode: referrerUsername.toLowerCase().trim(),
      createdAt: serverTimestamp() as Timestamp,
      totalReferrals: 0,
      totalPurchases: 0,
      totalAnalyses: 0,
    };

    await setDoc(doc(db, COLLECTIONS.USERS, userId), newUser);

    // Initialize analytics for new user
    await initializeUserAnalytics(userId, referrerUsername);

    console.log(`✅ Created referrer user: ${referrerUsername} (${userId})`);
  } else {
    userId = querySnapshot.docs[0].id;
  }

  // Update analytics
  const analyticsRef = doc(db, COLLECTIONS.USER_ANALYTICS, userId);

  const updateData: any = {
    [`referrals.${metric}`]: increment(1),
    lastUpdated: serverTimestamp(),
  };

  if (revenue) {
    updateData.revenue = increment(revenue);
  }

  await updateDoc(analyticsRef, updateData);
}

/**
 * Get user analytics for dashboard
 */
export async function getUserAnalytics(
  username: string
): Promise<UserAnalytics | null> {
  const usernameCleaned = username.toLowerCase().trim();

  // Find user by username
  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('referralCode', '==', usernameCleaned));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userId = querySnapshot.docs[0].id;

  // Get analytics
  const analyticsRef = doc(db, COLLECTIONS.USER_ANALYTICS, userId);
  const analyticsDoc = await getDoc(analyticsRef);

  if (!analyticsDoc.exists()) {
    return null;
  }

  return analyticsDoc.data() as UserAnalytics;
}

/**
 * Get referral events for a user
 */
export async function getReferralEvents(
  username: string,
  limit: number = 50
): Promise<ReferralEvent[]> {
  const usernameCleaned = username.toLowerCase().trim();

  const eventsRef = collection(db, COLLECTIONS.REFERRAL_EVENTS);
  const q = query(
    eventsRef,
    where('referrerId', '==', usernameCleaned)
    // Note: Firestore doesn't support orderBy with where on different fields without index
    // You'll need to create a composite index in Firebase Console
  );

  const querySnapshot = await getDocs(q);

  const events: ReferralEvent[] = [];
  querySnapshot.forEach((doc) => {
    events.push(doc.data() as ReferralEvent);
  });

  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);

  return events.slice(0, limit);
}

/**
 * Check if username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const usernameCleaned = username.toLowerCase().trim();

  const usersRef = collection(db, COLLECTIONS.USERS);
  const q = query(usersRef, where('referralCode', '==', usernameCleaned));
  const querySnapshot = await getDocs(q);

  return querySnapshot.empty;
}

/**
 * Get deeplink stats
 */
export async function getDeeplinkStats(username: string) {
  const usernameCleaned = username.toLowerCase().trim();

  const trackingRef = collection(db, COLLECTIONS.DEEPLINK_TRACKING);
  const q = query(trackingRef, where('referrer', '==', usernameCleaned));
  const querySnapshot = await getDocs(q);

  let totalClicks = 0;
  let convertedClicks = 0;
  let iosClicks = 0;
  let androidClicks = 0;
  let webClicks = 0;
  let directConversions = 0;
  let clipboardConversions = 0;
  let fingerprintConversions = 0;

  querySnapshot.forEach((doc) => {
    const data = doc.data() as DeeplinkTracking;
    totalClicks++;
    if (data.converted) {
      convertedClicks++;
      // Track conversion method
      if (data.conversionMethod === 'direct') directConversions++;
      else if (data.conversionMethod === 'clipboard') clipboardConversions++;
      else if (data.conversionMethod === 'fingerprint') fingerprintConversions++;
    }
    if (data.platform === 'ios') iosClicks++;
    if (data.platform === 'android') androidClicks++;
    if (data.platform === 'web') webClicks++;
  });

  const conversionRate =
    totalClicks > 0 ? (convertedClicks / totalClicks) * 100 : 0;

  return {
    totalClicks,
    convertedClicks,
    conversionRate: Math.round(conversionRate * 10) / 10,
    iosClicks,
    androidClicks,
    webClicks,
    conversionMethods: {
      direct: directConversions,
      clipboard: clipboardConversions,
      fingerprint: fingerprintConversions,
    },
  };
}
