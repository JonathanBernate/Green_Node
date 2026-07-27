import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { Card } from '@/presentation/components/ui/Card/Card';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useAuthStore } from '@/presentation/store/authStore';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';
import { dimensions } from '@/shared/constants/dimensions';

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

function getPointsForNextLevel(level: number): number {
  return level * 100;
}

export function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Body color={colors.textSecondary}>Cargando perfil...</Body>
        </View>
      </ScreenContainer>
    );
  }

  const nextLevelPoints = getPointsForNextLevel(user.level);
  const progress = Math.min(user.points / nextLevelPoints, 1);
  const levelLabel = getLevelLabel(user.level);

  return (
    <ScreenContainer safeAreaBottom={false}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Spacer size="md" />
          <Heading level={2} align="center">
            {user.name}
          </Heading>
          <Spacer size="xs" />
          <Body color={colors.textSecondary} align="center">
            {user.email}
          </Body>
          {user.neighborhood && (
            <>
              <Spacer size="xs" />
              <View style={styles.locationRow}>
                <Caption color={colors.primary[500]}>
                  📍 {user.neighborhood}
                </Caption>
              </View>
            </>
          )}
        </View>

        <Spacer size="xl" />

        {/* Level Card */}
        <Card variant="elevated" style={styles.levelCard}>
          <View style={styles.levelHeader}>
            <View>
              <Caption color={colors.textSecondary}>
                Nivel {user.level}
              </Caption>
              <Heading level={3} color={colors.primary[700]}>
                {levelLabel}
              </Heading>
            </View>
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsValue}>{user.points}</Text>
              <Caption color={colors.textSecondary}>puntos</Caption>
            </View>
          </View>

          <Spacer size="md" />

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
            <Spacer size="xs" />
            <Caption color={colors.textSecondary}>
              {user.points} / {nextLevelPoints} puntos para nivel{' '}
              {user.level + 1}
            </Caption>
          </View>
        </Card>

        <Spacer size="lg" />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <Card variant="outlined" style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Heading level={4} align="center">
              {user.points}
            </Heading>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              Puntos totales
            </Caption>
          </Card>

          <Card variant="outlined" style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Heading level={4} align="center">
              Nv. {user.level}
            </Heading>
            <Caption
              color={colors.textSecondary}
              style={{ textAlign: 'center' }}
            >
              Nivel actual
            </Caption>
          </Card>
        </View>

        <Spacer size="lg" />

        {/* Quick Actions */}
        <Heading level={4}>Acciones rápidas</Heading>
        <Spacer size="md" />

        <Card variant="outlined">
          <MenuItem
            icon="🏅"
            label="Gamificación"
            subtitle="Puntos, insignias y niveles"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="📊"
            label="Ranking"
            subtitle="Tabla de liderazgo por zona"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="💬"
            label="Chat de ayuda"
            subtitle="Asistente virtual"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="✏️"
            label="Editar perfil"
            subtitle="Actualiza tu información"
            onPress={() => {}}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="⚙️"
            label="Configuración"
            subtitle="Notificaciones, tema y más"
            onPress={() => {}}
          />
        </Card>

        <Spacer size="xl" />

        {/* Logout */}
        <ButtonPrimary
          onPress={logout}
          variant="outline"
          fullWidth
          size="large"
        >
          Cerrar Sesión
        </ButtonPrimary>

        <Spacer size="xxl" />
      </ScrollView>
    </ScreenContainer>
  );
}

function MenuItem({
  icon,
  label,
  subtitle,
  onPress,
}: {
  icon: string;
  label: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuText}>
        <Body fontWeight="600">{label}</Body>
        <Caption color={colors.textSecondary}>{subtitle}</Caption>
      </View>
      <Text style={styles.menuArrow}>›</Text>
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
  avatarSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary[300],
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[700],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelCard: {
    padding: spacing.xl,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsBadge: {
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: typography.fontSize.h2,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  progressContainer: {
    marginTop: spacing.xs,
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
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.neutral[100],
    marginVertical: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  menuIcon: {
    fontSize: 22,
  },
  menuText: {
    flex: 1,
  },
  menuArrow: {
    fontSize: 24,
    color: colors.neutral[400],
    fontWeight: typography.fontWeight.semibold,
  },
});
