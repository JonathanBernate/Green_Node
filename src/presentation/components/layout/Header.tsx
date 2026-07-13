import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: { icon: string; onPress: () => void };
}

export function Header({ title, subtitle, showBack, onBack, rightAction }: HeaderProps) {
  return (
    <View style={styles.container}>
      {showBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction ? (
        <Pressable onPress={rightAction.onPress} style={styles.actionButton}>
          <Text style={styles.actionIcon}>{rightAction.icon}</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: colors.text,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spacer: {
    width: 40,
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    fontSize: 20,
    color: colors.primary[500],
  },
});
