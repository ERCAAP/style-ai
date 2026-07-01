import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { I18nextProvider } from 'react-i18next';
import { Colors } from '@/constants/theme';
import { AuthProvider, OnboardingProvider } from '@/contexts';
import { ReferralProvider } from '@/contexts/ReferralContext';
import { initializeNotifications } from '@/services/notifications';
import { purchasesService } from '@/services/purchases';
import { initI18n, i18n } from '@/i18n';
import AppGate from '@/components/AppGate';

// Splash screen'i goster
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Paralel olarak baslat
        await Promise.all([
          // i18n'i initialize et
          initI18n().then(() => setI18nInitialized(true)),
          // Bildirimleri initialize et
          initializeNotifications().catch(console.warn),
          // RevenueCat'i initialize et
          purchasesService.initialize().catch(console.warn),
          // Minimum splash suresi
          new Promise(resolve => setTimeout(resolve, 500)),
        ]);
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady || !i18nInitialized) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <I18nextProvider i18n={i18n}>
        <ReferralProvider>
          <AuthProvider>
            <OnboardingProvider>
              <AppGate>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.background.start },
                  animation: 'slide_from_right',
                  animationDuration: 300,
                }}
              >
                <Stack.Screen
                  name="index"
                  options={{
                    headerShown: false,
                    animation: 'none',
                  }}
                />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    headerShown: false,
                    animation: 'fade',
                  }}
                />
                <Stack.Screen
                  name="onboarding"
                  options={{
                    headerShown: false,
                    animation: 'fade',
                    animationDuration: 400,
                  }}
                />
                <Stack.Screen
                  name="paywall"
                  options={{
                    headerShown: false,
                    presentation: 'card',
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="processing"
                  options={{
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    animationDuration: 250,
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="result"
                  options={{
                    presentation: 'modal',
                    animation: 'slide_from_bottom',
                    animationDuration: 350,
                    gestureEnabled: true,
                    gestureDirection: 'vertical',
                  }}
                />
                <Stack.Screen
                  name="analysis-result"
                  options={{
                    presentation: 'card',
                    animation: 'slide_from_right',
                    animationDuration: 300,
                    gestureEnabled: true,
                  }}
                />
                <Stack.Screen
                  name="force-update"
                  options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen
                  name="maintenance"
                  options={{
                    headerShown: false,
                    presentation: 'fullScreenModal',
                    animation: 'fade',
                    gestureEnabled: false,
                  }}
                />
              </Stack>
              </AppGate>
            </OnboardingProvider>
          </AuthProvider>
        </ReferralProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.start,
  },
});
