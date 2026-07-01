import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Colors, Layout, Shadows } from '@/constants/theme';

type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size: number;
  focused: boolean;
};

function TabIcon({ name, color, focused }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

function TabBarBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassOverlay} />
      <View style={styles.glassHighlight} />
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.tabBar.active,
        tabBarInactiveTintColor: Colors.tabBar.inactive,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t('tabs.history'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'time' : 'time-outline'} color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe', { defaultValue: 'Dolap' }),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'shirt' : 'shirt-outline'} color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'settings' : 'settings-outline'} color={color} focused={focused} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="dress-change"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    height: 54,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderRadius: 27,
    marginHorizontal: 24,
    marginBottom: Platform.OS === 'ios' ? 32 : 20,
    elevation: Platform.OS === 'android' ? 8 : 0,
    paddingBottom: 4,
    paddingTop: 4,
    borderWidth: Platform.OS === 'android' ? 1 : 0.5,
    borderColor: Platform.OS === 'android' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Platform.OS === 'android' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.85)',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 0.5,
  },
  tabBarLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 1,
    letterSpacing: 0.2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 28,
    borderRadius: 14,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
});
