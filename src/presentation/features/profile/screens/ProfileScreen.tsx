import React, { useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useAuthStore } from '@/presentation/store/authStore';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import { useIoTStore } from '@/presentation/store/iotStore';
import { MqttConnectionState } from '@/data/datasources/remote/mqtt/MqttClient';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

export function ProfileScreen() {
  const { user, logout, isLoading } = useAuthStore();
  const classificationHistory = useClassificationStore((s) => s.history);
  const { connectionState, publishCount } = useIoTStore();

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => logout() },
      ],
    );
  }, [logout]);

  const connectionLabel = {
    [MqttConnectionState.CONNECTED]: '🟢 Conectado a la red IoT',
    [MqttConnectionState.CONNECTING]: '🟡 Conectando...',
    [MqttConnectionState.RECONNECTING]: '🟡 Reconectando...',
    [MqttConnectionState.DISCONNECTED]: '🔴 Sin conexión IoT',
  }[connectionState];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar & Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <Spacer size="md" />
          <Heading level={2} align="center">
            {user?.name ?? 'Usuario'}
          </Heading>
          <Caption color={colors.neutral[500]} align="center">
            {user?.email}
          </Caption>
          {user?.neighborhood && (
            <Caption color={colors.neutral[400]} align="center">
              📍 {user.neighborhood}
            </Caption>
          )}
        </View>

        <Spacer size="xl" />

        {/* Stats de gamificación */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.primary[600]}>
              {user?.points ?? 0}
            </Body>
            <Caption color={colors.neutral[500]}>Puntos</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.neutral[700]}>
              Nivel {user?.level ?? 1}
            </Body>
            <Caption color={colors.neutral[500]}>Nivel</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.semantic.success}>
              {classificationHistory.length}
            </Body>
            <Caption color={colors.neutral[500]}>Escaneos</Caption>
          </View>
        </View>

        <Spacer size="xl" />

        {/* Estado IoT */}
        <View style={styles.section}>
          <Heading level={3}>Red IoT</Heading>
          <Spacer size="sm" />
          <View style={styles.iotInfo}>
            <Body>{connectionLabel}</Body>
            <Caption color={colors.neutral[400]}>
              Mensajes enviados: {publishCount}
            </Caption>
          </View>
        </View>

        <Spacer size="lg" />

        {/* Opciones del menú */}
        <View style={styles.section}>
          <Heading level={3}>Cuenta</Heading>
          <Spacer size="sm" />
          <MenuItem icon="✏️" label="Editar perfil" />
          <MenuItem icon="🏆" label="Logros e insignias" />
          <MenuItem icon="📊" label="Estadísticas detalladas" />
          <MenuItem icon="🔔" label="Notificaciones" />
          <MenuItem icon="🎨" label="Tema oscuro (pronto)" />
          <MenuItem icon="ℹ️" label="Acerca de GreenNode" />
        </View>

        <Spacer size="xxl" />

        {/* Logout */}
        <ButtonPrimary
          onPress={handleLogout}
          variant="outline"
          fullWidth
          size="large"
          loading={isLoading}
        >
          Cerrar sesión
        </ButtonPrimary>

        <Spacer size="lg" />

        <Caption color={colors.neutral[300]} align="center">
          GreenNode v0.1.0 — Proyecto de Grado UDFJC
        </Caption>

        <Spacer size="xl" />
      </ScrollView>
    </ScreenContainer>
  );
}

function MenuItem({ icon, label }: { icon: string; label: string }) {
  return (
    <Pressable style={styles.menuItem}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Body>{label}</Body>
      <Text style={styles.menuChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  iotInfo: {
    gap: spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    gap: spacing.md,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuChevron: {
    fontSize: 20,
    color: colors.neutral[400],
    marginLeft: 'auto',
  },
});
