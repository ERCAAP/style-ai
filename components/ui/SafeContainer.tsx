import { View, StyleSheet, ViewStyle, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientBackground } from './GradientBackground';
import { Colors } from '@/constants/theme';

interface SafeContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
  withGradient?: boolean;
  withBottomPadding?: boolean;
}

export function SafeContainer({
  children,
  style,
  edges = ['top'],
  withGradient = true,
  withBottomPadding = false,
}: SafeContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') || withBottomPadding ? insets.bottom : 0,
    paddingLeft: edges.includes('left') ? insets.left : 0,
    paddingRight: edges.includes('right') ? insets.right : 0,
  };

  const content = (
    <View style={[styles.container, containerStyle, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.start} />
      {children}
    </View>
  );

  if (withGradient) {
    return <GradientBackground>{content}</GradientBackground>;
  }

  return (
    <View style={[styles.container, styles.solidBackground, containerStyle, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.start} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  solidBackground: {
    backgroundColor: Colors.background.start,
  },
});
