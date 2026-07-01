// Input - Form input component

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Animations,
} from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  disabled = false,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = useSharedValue(Colors.border.default);

  const animatedStyle = useAnimatedStyle(() => ({
    borderColor: borderColor.value,
  }));

  const handleFocus = () => {
    setIsFocused(true);
    borderColor.value = withTiming(
      error ? Colors.accent.error : Colors.accent.primary,
      { duration: Animations.timing.fast }
    );
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setIsFocused(false);
    borderColor.value = withTiming(
      error ? Colors.accent.error : Colors.border.default,
      { duration: Animations.timing.fast }
    );
    props.onBlur?.({} as any);
  };

  const getBorderColor = () => {
    if (error) return Colors.accent.error;
    if (isFocused) return Colors.accent.primary;
    return Colors.border.default;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Animated.View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={20}
            color={isFocused ? Colors.accent.primary : Colors.text.muted}
            style={styles.leftIcon}
          />
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            disabled && styles.inputDisabled,
            style,
          ]}
          placeholderTextColor={Colors.text.muted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled}
          {...props}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
          >
            <Ionicons
              name={rightIcon as any}
              size={20}
              color={Colors.text.muted}
            />
          </Pressable>
        )}
      </Animated.View>

      {(error || hint) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || hint}
        </Text>
      )}
    </View>
  );
}

// Password input variant
interface PasswordInputProps extends Omit<InputProps, 'rightIcon' | 'onRightIconPress' | 'secureTextEntry'> {}

export function PasswordInput(props: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      {...props}
      secureTextEntry={!showPassword}
      rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
      onRightIconPress={() => setShowPassword(!showPassword)}
    />
  );
}

// Search input variant
interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onClear?: () => void;
}

export function SearchInput({ onClear, value, ...props }: SearchInputProps) {
  return (
    <Input
      {...props}
      value={value}
      leftIcon="search-outline"
      rightIcon={value ? 'close-circle' : undefined}
      onRightIconPress={onClear}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  inputContainerDisabled: {
    backgroundColor: Colors.border.light,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: Colors.text.disabled,
  },
  leftIcon: {
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
  },
  rightIconContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  helperText: {
    ...Typography.caption,
    color: Colors.text.muted,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  errorText: {
    color: Colors.accent.error,
  },
});

export default Input;
