import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useSegments, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';
import {
  initializeRemoteConfig,
  isMaintenanceModeEnabled,
  isForceUpdateRequired,
  refreshRemoteConfig,
} from '@/services/firebase/remoteConfig';

interface AppGateProps {
  children: React.ReactNode;
}

export default function AppGate({ children }: AppGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [shouldShowMaintenance, setShouldShowMaintenance] = useState(false);
  const [shouldShowForceUpdate, setShouldShowForceUpdate] = useState(false);
  const segments = useSegments();
  const pathname = usePathname();

  useEffect(() => {
    checkAppStatus();
  }, []);

  // Re-check when app comes to foreground
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isChecking) {
        checkAppStatus(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isChecking]);

  const checkAppStatus = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsChecking(true);
      }

      // Initialize or refresh remote config
      if (isRefresh) {
        await refreshRemoteConfig();
      } else {
        await initializeRemoteConfig();
      }

      // Check force update first (highest priority)
      const forceUpdate = isForceUpdateRequired();
      if (forceUpdate) {
        setShouldShowForceUpdate(true);
        setShouldShowMaintenance(false);

        // Navigate to force update screen if not already there
        if (pathname !== '/force-update') {
          router.replace('/force-update');
        }
        return;
      }

      // Check maintenance mode (second priority)
      const maintenance = isMaintenanceModeEnabled();
      if (maintenance) {
        setShouldShowForceUpdate(false);
        setShouldShowMaintenance(true);

        // Navigate to maintenance screen if not already there
        if (pathname !== '/maintenance') {
          router.replace('/maintenance');
        }
        return;
      }

      // App is normal, clear any blocks
      setShouldShowForceUpdate(false);
      setShouldShowMaintenance(false);

      // If we were on force-update or maintenance screen, navigate back to main app
      if (pathname === '/force-update' || pathname === '/maintenance') {
        // Check if user has completed onboarding
        const onboardingCompleted = true; // This will be checked by the app's normal flow
        if (onboardingCompleted) {
          router.replace('/(tabs)');
        } else {
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('[AppGate] Status check error:', error);
      // On error, allow app to continue (fail open)
      setShouldShowForceUpdate(false);
      setShouldShowMaintenance(false);
    } finally {
      setIsChecking(false);
    }
  };

  // Show loading screen during initial check
  if (isChecking) {
    return (
      <LinearGradient
        colors={[Colors.background.start, Colors.background.end]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </LinearGradient>
    );
  }

  // If force update or maintenance is required, the routing is handled in checkAppStatus
  // Just return children and let the router handle the screen
  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
