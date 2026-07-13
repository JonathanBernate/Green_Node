import React from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { dimensions } from '@/shared/constants/dimensions';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  editable?: boolean;
  style?: ViewStyle;
}

export function TextInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  error,
  multiline,
  numberOfLines,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  style,
}: TextInputProps) {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        style={[
          styles.input,
          error && styles.inputError,
          !editable && styles.inputDisabled,
          multiline && { height: (numberOfLines ?? 3) * 24 + spacing.md * 2 },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.bodySmall,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.fontSize.body,
    color: colors.text,
    backgroundColor: colors.neutral[50],
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
  inputDisabled: {
    backgroundColor: colors.neutral[100],
    color: colors.neutral[500],
  },
  error: {
    fontSize: typography.fontSize.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
  },
});
