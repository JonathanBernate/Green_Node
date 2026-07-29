import React, { useMemo } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { MapStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useContainerStore } from '@/presentation/store/containerStore';
import {
  getFillLevelCategory,
  FILL_LEVEL_COLORS,
  ContainerStatus,
} from '@/domain/entities/Container';
import { WASTE_TYPE_LABELS, WASTE_TYPE_ICONS, WasteType } from '@/domain/entities/WasteClassification';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type RoutePropType = RouteProp<MapStackParamList, 'ContainerDetailScreen'>;

export function ContainerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RoutePropType>();
  const containers = useContainerStore((s) => s.containers);

  const container = useMemo(
    () => containers.find((c) => c.id === route.params.containerId),
    [containers, route.params.containerId],
  );

  if (!container) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Body>Contenedor no encontrado</Body>
          <Spacer size="lg" />
          <ButtonPrimary onPress={() => navigation.goBack()} size="medium">
            Volver
          </ButtonPrimary>
        </View>
      </ScreenContainer>
    );
  }

  const category = getFillLevelCategory(container.fillLevel);
  const fillColor = FILL_LEVEL_COLORS[category];

  const statusLabel = {
    [ContainerStatus.ACTIVE]: '✅ Activo',
    [ContainerStatus.FULL]: '🔴 Lleno — Requiere recolección',
    [ContainerStatus.MAINTENANCE]: '🔧 En mantenimiento',
    [ContainerStatus.OFFLINE]: '⚫ Sin conexión',
  }[container.status];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back button */}
        <ButtonPrimary
          onPress={() => navigation.goBack()}
          variant="ghost"
          size="small"
        >
          ← Volver al mapa
        </ButtonPrimary>

        <Spacer size="lg" />

        {/* Fill level visual */}
        <View style={[styles.fillCard, { borderColor: fillColor }]}>
          <View style={[styles.fillCircle, { borderColor: fillColor }]}>
            <Text style={[styles.fillPercent, { color: fillColor }]}>
              {Math.round(container.fillLevel)}%
            </Text>
            <Caption color={colors.neutral[500]}>lleno</Caption>
          </View>
          <Spacer size="md" />
          <View style={styles.fillBarLarge}>
            <View
              style={[
                styles.fillBarFillLarge,
                { width: `${container.fillLevel}%`, backgroundColor: fillColor },
              ]}
            />
          </View>
        </View>

        <Spacer size="xl" />

        {/* Información del contenedor */}
        <View style={styles.infoSection}>
          <Heading level={3}>📍 Ubicación</Heading>
          <Spacer size="sm" />
          <Body>{container.address}</Body>
          <Caption color={colors.neutral[400]}>
            Lat: {container.location.latitude.toFixed(4)}, Lng:{' '}
            {container.location.longitude.toFixed(4)}
          </Caption>
        </View>

        <Spacer size="lg" />

        {/* Estado */}
        <View style={styles.infoSection}>
          <Heading level={3}>Estado</Heading>
          <Spacer size="sm" />
          <Body>{statusLabel}</Body>
          <Caption color={colors.neutral[400]}>
            Última actualización:{' '}
            {new Date(container.lastUpdated).toLocaleString()}
          </Caption>
        </View>

        <Spacer size="lg" />

        {/* Especificaciones */}
        <View style={styles.infoSection}>
          <Heading level={3}>Especificaciones</Heading>
          <Spacer size="sm" />
          <View style={styles.specRow}>
            <Caption color={colors.neutral[500]}>Capacidad:</Caption>
            <Body fontWeight="600">{container.capacity} litros</Body>
          </View>
          <View style={styles.specRow}>
            <Caption color={colors.neutral[500]}>ID del nodo:</Caption>
            <Body fontWeight="600">{container.id}</Body>
          </View>
        </View>

        <Spacer size="lg" />

        {/* Tipos de residuos aceptados */}
        <View style={styles.infoSection}>
          <Heading level={3}>Residuos aceptados</Heading>
          <Spacer size="sm" />
          <View style={styles.wasteTypesGrid}>
            {container.wasteTypes.map((type) => {
              const wasteType = type as WasteType;
              const label = WASTE_TYPE_LABELS[wasteType] ?? type;
              const icon = WASTE_TYPE_ICONS[wasteType] ?? '♻️';
              return (
                <View key={type} style={styles.wasteChip}>
                  <Text style={styles.wasteIcon}>{icon}</Text>
                  <Caption color={colors.neutral[700]}>{label}</Caption>
                </View>
              );
            })}
          </View>
        </View>

        <Spacer size="xxl" />

        {/* Acción: navegar */}
        <ButtonPrimary onPress={() => {}} fullWidth size="large">
          🧭  Cómo llegar
        </ButtonPrimary>

        <Spacer size="md" />

        <ButtonPrimary
          onPress={() => {}}
          variant="outline"
          fullWidth
          size="medium"
        >
          📷  Depositar residuo aquí
        </ButtonPrimary>

        <Spacer size="xl" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  fillCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  fillCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
  fillPercent: {
    fontSize: 32,
    fontWeight: '800',
  },
  fillBarLarge: {
    width: '100%',
    height: 10,
    backgroundColor: colors.neutral[200],
    borderRadius: 5,
    overflow: 'hidden',
  },
  fillBarFillLarge: {
    height: '100%',
    borderRadius: 5,
  },
  infoSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: 14,
    padding: spacing.lg,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  wasteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  wasteIcon: {
    fontSize: 16,
  },
});
