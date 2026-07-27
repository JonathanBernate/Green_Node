import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { dimensions } from '@/shared/constants/dimensions';

interface AppHeaderProps {
  title?: string;
  rightAction?: { icon: string; onPress: () => void };
}

export function AppHeader({ title = 'GreenNode', rightAction }: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.content}>
        <View style={styles.left}>
          <Text style={styles.logoIcon}>♻️</Text>
          <Text style={styles.title}>{title}</Text>
        </View>

        {rightAction ? (
          <Pressable onPress={rightAction.onPress} style={styles.actionButton}>
            <Text style={styles.actionIcon}>{rightAction.icon}</Text>
          </Pressable>
        ) : (
          <View style={styles.spacer} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[500],
    paddingBottom: spacing.md,
    borderBottomLeftRadius: dimensions.borderRadius.xl,
    borderBottomRightRadius: dimensions.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    fontSize: 24,
  },
  title: {
    fontSize: typography.fontSize.h3,
    fontWeight: typography.fontWeight.bold,
    color: colors.neutral[50],
  },
  actionButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: dimensions.borderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  actionIcon: {
    fontSize: 20,
    color: colors.neutral[50],
  },
  spacer: {
    width: 40,
  },
});
