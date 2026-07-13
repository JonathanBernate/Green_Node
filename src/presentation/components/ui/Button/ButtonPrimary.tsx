import React, { ReactNode } from 'react';
import { Pressable, ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { dimensions } from '@/shared/constants/dimensions';
import { typography } from '@/shared/constants/typography';

interface ButtonPrimaryProps {
  children: ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}

export function ButtonPrimary({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonPrimaryProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = (): ViewStyle[] => {
    switch (variant) {
      case 'secondary':
        return [styles.container, styles.secondary];
      case 'outline':
        return [styles.container, styles.outline];
      case 'ghost':
        return [styles.container, styles.ghost];
      case 'primary':
      default:
        return [styles.container, styles.primary];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.neutral[50];
      case 'secondary':
        return colors.neutral[800];
      case 'outline':
        return colors.primary[500];
      case 'ghost':
        return colors.primary[500];
      default:
        return colors.neutral[50];
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...getContainerStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        (pressed || isDisabled) && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} style={styles.loader} />
      ) : icon ? (
        <View style={styles.iconContainer}>{icon}</View>
      ) : null}
      <>{children}</>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dimensions.borderRadius.lg,
  },
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.neutral[200],
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary[500],
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  small: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 36,
  },
  medium: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
  },
  large: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: 56,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  loader: {
    marginRight: spacing.sm,
  },
  iconContainer: {
    marginRight: spacing.sm,
  },
  textSmall: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  textMedium: {
    fontSize: typography.fontSize.body,
    fontWeight: '600',
    textAlign: 'center',
  },
  textLarge: {
    fontSize: typography.fontSize.h3,
    fontWeight: '600',
    textAlign: 'center',
  },
});
