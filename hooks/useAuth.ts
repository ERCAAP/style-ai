import { useState, useEffect, useCallback } from 'react';
import {
  AppUser,
  signInAnonymouslyAsync,
  signOut as firebaseSignOut,
  onAuthStateChange,
  getCurrentUser,
  getUserProfile,
} from '@/services/firebase/auth';

interface UserProfile {
  subscription: {
    status: 'free' | 'trial' | 'active' | 'expired' | 'cancelled';
    plan: string | null;
  };
  usage: {
    totalJobs: number;
    jobsToday: number;
    dailyLimit: number;
  };
  flags: {
    isBlocked: boolean;
    isVIP: boolean;
  };
}

interface UseAuthReturn {
  user: AppUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  isPremium: boolean;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        // Kullanıcı profili çek
        try {
          const userProfile = await getUserProfile(authUser.uid);
          if (userProfile) {
            setProfile({
              subscription: userProfile.subscription,
              usage: userProfile.usage,
              flags: userProfile.flags,
            });
          }
        } catch (error) {
          console.error('Profile fetch error:', error);
        }
      } else {
        setProfile(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInAnonymously = useCallback(async () => {
    setIsLoading(true);
    try {
      const authUser = await signInAnonymouslyAsync();
      setUser(authUser);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await firebaseSignOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;

    try {
      const userProfile = await getUserProfile(user.uid);
      if (userProfile) {
        setProfile({
          subscription: userProfile.subscription,
          usage: userProfile.usage,
          flags: userProfile.flags,
        });
      }
    } catch (error) {
      console.error('Profile refresh error:', error);
    }
  }, [user]);

  const isAuthenticated = !!user;
  const isAnonymous = user?.isAnonymous ?? false;
  const isPremium = profile?.subscription.status === 'active';

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    isAnonymous,
    isPremium,
    signInAnonymously,
    signOut,
    refreshProfile,
  };
}
