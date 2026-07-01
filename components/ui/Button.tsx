import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, BorderRadius, Shadows, Gradients } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'premium';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const sizeStyles = getSizeStyles(size);
  const isDisabled = disabled || loading;

  const content = (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.accent.primary : Colors.text.white}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Text
            style={[
              styles.text,
              sizeStyles.text,
              getTextStyle(variant),
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </>
  );

  // Primary ve Premium variant'lari gradient kullanir
  if ((variant === 'primary' || variant === 'premium') && !isDisabled) {
    const gradientColors: [string, string] = variant === 'premium'
      ? [Gradients.premium.colors[0], Gradients.premium.colors[1]]
      : [Gradients.button.colors[0], Gradients.button.colors[1]];

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            sizeStyles.button,
            variant === 'primary' && Shadows.glow,
            fullWidth && styles.fullWidth,
          ]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isDisabled}
      style={[
        styles.button,
        sizeStyles.button,
        getVariantStyle(variant),
        isDisabled && styles.buttonDisabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {content}
    </TouchableOpacity>
  );
}

const getSizeStyles = (size: ButtonSize): { button: ViewStyle; text: TextStyle } => {
  switch (size) {
    case 'sm':
      return {
        button: {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.base,
          borderRadius: BorderRadius.md,
        },
        text: {
          fontSize: 14,
        },
      };
    case 'lg':
      return {
        button: {
          paddingVertical: Spacing.base,
          paddingHorizontal: Spacing.xl,
          borderRadius: BorderRadius.lg,
        },
        text: {
          fontSize: 18,
        },
      };
    default: // md
      return {
        button: {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          borderRadius: BorderRadius.base,
        },
        text: {
          fontSize: 16,
        },
      };
  }
};

const getVariantStyle = (variant: ButtonVariant): ViewStyle => {
  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: Colors.background.secondary,
        borderWidth: 1,
        borderColor: Colors.border.default,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: Colors.accent.primary,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
      };
    default:
      return {
        backgroundColor: Colors.accent.primary,
      };
  }
};

const getTextStyle = (variant: ButtonVariant): TextStyle => {
  switch (variant) {
    case 'outline':
    case 'ghost':
      return {
        color: Colors.accent.primary,
      };
    case 'secondary':
      return {
        color: Colors.text.primary,
      };
    case 'premium':
      return {
        color: Colors.text.primary,
        fontWeight: '700',
      };
    default:
      return {
        color: Colors.text.white,
      };
  }
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  textDisabled: {
    color: Colors.text.disabled,
  },
  buttonDisabled: {
    backgroundColor: Colors.background.secondary,
    borderColor: Colors.border.default,
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
});
