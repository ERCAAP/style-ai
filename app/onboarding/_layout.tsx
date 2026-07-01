// Onboarding Layout - OnboardingProvider ile sarili Stack

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';
import { OnboardingProvider } from '@/contexts';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
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
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="features"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="questions"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="complete"
          options={{
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </OnboardingProvider>
  );
}
