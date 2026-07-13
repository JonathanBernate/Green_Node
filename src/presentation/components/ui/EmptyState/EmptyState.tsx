import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { ButtonPrimary } from '../Button/ButtonPrimary';

interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, message, icon = '📭', action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {action && (
        <View style={styles.actionContainer}>
          <ButtonPrimary onPress={action.onPress} variant="outline" size="small">
            {action.label}
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
    paddingVertical: spacing.huge,
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
  actionContainer: {
    marginTop: spacing.xl,
  },
});
