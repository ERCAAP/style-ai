// Questions Layout - Soru ekranlari grubu

import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function QuestionsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background.start },
        animation: 'slide_from_right',
        animationDuration: 250,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="body-type" />
      <Stack.Screen name="colors" />
      <Stack.Screen name="goals" />
    </Stack>
  );
}
