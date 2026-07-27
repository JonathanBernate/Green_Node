import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { Card } from '@/presentation/components/ui/Card/Card';
import { useAuthStore } from '@/presentation/store/authStore';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { dimensions } from '@/shared/constants/dimensions';

type NavProp = BottomTabNavigationProp<MainTabParamList>;

const LEVEL_LABELS: Record<number, string> = {
  1: 'Principiante',
  2: 'Explorador',
  3: 'Eco-Warrior',
  4: 'Guardián Verde',
  5: 'Maestro Reciclador',
};

function getLevelLabel(level: number): string {
  if (level >= 5) return LEVEL_LABELS[5];
  return LEVEL_LABELS[level] ?? LEVEL_LABELS[1];
}

export function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    console.log('[HomeScreen] user from store:', JSON.stringify(user));
    fetchUser().then(() => {
      const updatedUser = useAuthStore.getState().user;
      console.log('[HomeScreen] user after fetch:', JSON.stringify(updatedUser));
    });
  }, [fetchUser]);

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Body color={colors.textSecondary}>Cargando...</Body>
        </View>
      </ScreenContainer>
    );
  }

  const levelLabel = getLevelLabel(user.level);
  const nextLevelPoints = user.level * 100;
  const progress = Math.min(user.points / nextLevelPoints, 1);

  return (
    <ScreenContainer safeAreaBottom={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <View>
            <Body color={colors.textSecondary}>Bienvenido</Body>
            <Heading level={2}>{user.name.split(' ')[0]}</Heading>
          </View>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipText}>
              Nv. {user.level} · {levelLabel}
            </Text>
          </View>
        </View>

        <Spacer size="xl" />

        {/* Points + Level Card */}
        <Card variant="elevated" style={styles.pointsCard}>
          <View style={styles.pointsRow}>
            <View>
              <Caption color={colors.textSecondary}>Tus puntos</Caption>
              <Text style={styles.pointsNumber}>{user.points}</Text>
            </View>
            <View style={styles.pointsIcon}>
              <Text style={styles.trophyEmoji}>🏆</Text>
            </View>
          </View>

          <Spacer size="md" />

          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Spacer size="xs" />
          <Caption color={colors.textSecondary}>
            {user.points} / {nextLevelPoints} puntos para nivel {user.level + 1}
          </Caption>
        </Card>

        <Spacer size="lg" />

        {/* Quick Actions */}
        <Heading level={4}>Acciones rápidas</Heading>
        <Spacer size="md" />

        <View style={styles.actionsGrid}>
          <QuickAction
            icon="📷"
            label="Escanear"
            color={colors.primary[50]}
            onPress={() => navigation.navigate('ScanTab')}
          />
          <QuickAction
            icon="🗺️"
            label="Mapa"
            color={colors.semantic.info + '15'}
            onPress={() => navigation.navigate('MapTab')}
          />
          <QuickAction
            icon="📋"
            label="Historial"
            color={colors.semantic.warning + '15'}
            onPress={() => navigation.navigate('HistoryTab')}
          />
          <QuickAction
            icon="📚"
            label="Aprender"
            color={colors.semantic.success + '15'}
            onPress={() => navigation.navigate('EducationTab')}
          />
        </View>

        <Spacer size="xl" />

        {/* Eco Tip */}
        <Card variant="outlined" style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Text style={styles.tipIcon}>💡</Text>
            <Heading level={4}>Día del día</Heading>
          </View>
          <Spacer size="sm" />
          <Body color={colors.neutral[700]}>
            ¿Sabías que reciclar una lata de aluminio ahorra suficiente energía
            para encender un televisor por 3 horas? ¡Cada depósito cuenta!
          </Body>
        </Card>

        <Spacer size="lg" />

        {/* Status Summary */}
        <Heading level={4}>Tu resumen</Heading>
        <Spacer size="md" />

        <View style={styles.summaryGrid}>
          <Card variant="outlined" style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>♻️</Text>
            <Heading level={3} align="center">
              0
            </Heading>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              Clasificaciones
            </Caption>
          </Card>

          <Card variant="outlined" style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>📦</Text>
            <Heading level={3} align="center">
              0
            </Heading>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              Depósitos
            </Caption>
          </Card>

          <Card variant="outlined" style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>🔥</Text>
            <Heading level={3} align="center">
              0
            </Heading>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              Racha días
            </Caption>
          </Card>
        </View>

        <Spacer size="xxl" />
      </ScrollView>
    </ScreenContainer>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.quickAction, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.quickActionIcon}>{icon}</Text>
      <Body fontWeight="600" style={styles.quickActionLabel}>
        {label}
      </Body>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  greetingSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelChip: {
    backgroundColor: colors.primary[50],
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: dimensions.borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  levelChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[700],
  },
  pointsCard: {
    padding: spacing.xl,
  },
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsNumber: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyEmoji: {
    fontSize: 28,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: dimensions.borderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: dimensions.borderRadius.full,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderRadius: dimensions.borderRadius.lg,
    gap: spacing.sm,
  },
  quickActionIcon: {
    fontSize: 32,
  },
  quickActionLabel: {
    fontSize: typography.fontSize.bodySmall,
  },
  tipCard: {
    padding: spacing.xl,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipIcon: {
    fontSize: 22,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  summaryIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
});
