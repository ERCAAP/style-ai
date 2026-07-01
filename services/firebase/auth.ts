import {
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { getDeviceId } from '../device';

export interface AppUser {
  uid: string;
  email: string | null;
  isAnonymous: boolean;
  displayName: string | null;
  photoURL: string | null;
  createdAt: Date | null;
}

// Kullanıcı Firestore kaydı oluştur/güncelle
async function createOrUpdateUserRecord(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  const deviceId = await getDeviceId();

  if (!userSnap.exists()) {
    // Yeni kullanıcı
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      deviceId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
      subscription: {
        status: 'free',
        plan: null,
        startDate: null,
        endDate: null,
      },
      usage: {
        totalJobs: 0,
        jobsToday: 0,
        lastJobDate: null,
        dailyLimit: 3,
      },
      preferences: {
        notificationsEnabled: true,
        language: 'tr',
      },
      flags: {
        isBlocked: false,
        isVIP: false,
      },
    });
  } else {
    // Mevcut kullanıcı - lastActiveAt güncelle
    await setDoc(
      userRef,
      {
        lastActiveAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

// Anonim giriş
export async function signInAnonymouslyAsync(): Promise<AppUser> {
  try {
    const result = await signInAnonymously(auth);
    await createOrUpdateUserRecord(result.user);

    return {
      uid: result.user.uid,
      email: result.user.email,
      isAnonymous: result.user.isAnonymous,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      createdAt: result.user.metadata.creationTime
        ? new Date(result.user.metadata.creationTime)
        : null,
    };
  } catch (error) {
    console.error('Anonymous sign in error:', error);
    throw error;
  }
}

// Email ile kayıt
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AppUser> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserRecord(result.user);

    return {
      uid: result.user.uid,
      email: result.user.email,
      isAnonymous: result.user.isAnonymous,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      createdAt: result.user.metadata.creationTime
        ? new Date(result.user.metadata.creationTime)
        : null,
    };
  } catch (error) {
    console.error('Email sign up error:', error);
    throw error;
  }
}

// Email ile giriş
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AppUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await createOrUpdateUserRecord(result.user);

    return {
      uid: result.user.uid,
      email: result.user.email,
      isAnonymous: result.user.isAnonymous,
      displayName: result.user.displayName,
      photoURL: result.user.photoURL,
      createdAt: result.user.metadata.creationTime
        ? new Date(result.user.metadata.creationTime)
        : null,
    };
  } catch (error) {
    console.error('Email sign in error:', error);
    throw error;
  }
}

// Çıkış yap
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}

// Mevcut kullanıcıyı al
export function getCurrentUser(): AppUser | null {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    isAnonymous: user.isAnonymous,
    displayName: user.displayName,
    photoURL: user.photoURL,
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime)
      : null,
  };
}

// Auth durumu değişikliklerini dinle
export function onAuthStateChange(
  callback: (user: AppUser | null) => void
): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        isAnonymous: firebaseUser.isAnonymous,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        createdAt: firebaseUser.metadata.creationTime
          ? new Date(firebaseUser.metadata.creationTime)
          : null,
      });
    } else {
      callback(null);
    }
  });
}

// Kullanıcı profilini Firestore'dan al
export async function getUserProfile(uid: string) {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();
    }
    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
}

// Kullanıcının abonelik durumunu güncelle
export async function updateSubscriptionStatus(
  uid: string,
  status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled',
  plan?: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    const updateData: any = {
      'subscription.status': status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'active') {
      updateData['subscription.startDate'] = serverTimestamp();
      if (plan) {
        updateData['subscription.plan'] = plan;
      }
      // Pro kullanıcılar için sınırsız kullanım
      updateData['usage.dailyLimit'] = -1;
    } else if (status === 'free' || status === 'expired' || status === 'cancelled') {
      updateData['subscription.endDate'] = serverTimestamp();
      // Free kullanıcılar için günlük limit
      updateData['usage.dailyLimit'] = 3;
    }

    await setDoc(userRef, updateData, { merge: true });
    console.log('✅ Subscription status updated in Firestore:', { uid, status, plan });
  } catch (error) {
    console.error('Update subscription status error:', error);
    throw error;
  }
}

// Kullanıcının dil tercihini güncelle
export async function updateUserLanguagePreference(
  uid: string,
  language: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        'preferences.language': language,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('✅ Language preference updated in Firestore:', { uid, language });
  } catch (error) {
    console.error('Update language preference error:', error);
    throw error;
  }
}
