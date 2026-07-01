// App Entry Point - Onboarding kontrolu ve yonlendirme

import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboardingContext } from '@/contexts';
import { Colors } from '@/constants/theme';

export default function Index() {
  const router = useRouter();
  const { isCompleted, isLoading } = useOnboardingContext();

  useEffect(() => {
    if (!isLoading) {
      if (isCompleted) {
        // Onboarding tamamlanmis, ana sayfaya git
        router.replace('/(tabs)');
      } else {
        // Onboarding tamamlanmamis, onboarding'e git
        router.replace('/onboarding');
      }
    }
  }, [isLoading, isCompleted, router]);

  // Yukleniyor ekrani
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.accent.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.start,
  },
});
