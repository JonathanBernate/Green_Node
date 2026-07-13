import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { ButtonPrimary } from '../Button/ButtonPrimary';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Intenta de nuevo.',
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <View style={styles.action}>
          <ButtonPrimary onPress={onRetry} variant="outline" size="small">
            Reintentar
          </ButtonPrimary>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  icon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.fontSize.body,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.xl,
  },
});
