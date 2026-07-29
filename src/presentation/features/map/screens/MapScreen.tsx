import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { useContainerStore } from '@/presentation/store/containerStore';
import {
  getFillLevelCategory,
  FILL_LEVEL_COLORS,
  ContainerStatus,
} from '@/domain/entities/Container';
import type { Container } from '@/domain/entities/Container';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type NavProp = NativeStackNavigationProp<MapStackParamList, 'MapScreen'>;

type FilterOption = 'all' | 'available' | 'full' | 'maintenance';

export function MapScreen() {
  const navigation = useNavigation<NavProp>();
  const containers = useContainerStore((s) => s.containers);
  const lastUpdated = useContainerStore((s) => s.lastUpdated);
  const [filter, setFilter] = useState<FilterOption>('all');

  const filteredContainers = useMemo(() => {
    switch (filter) {
      case 'available':
        return containers.filter(
          (c) => c.status === ContainerStatus.ACTIVE && c.fillLevel < 90,
        );
      case 'full':
        return containers.filter((c) => c.fillLevel >= 90);
      case 'maintenance':
        return containers.filter(
          (c) => c.status === ContainerStatus.MAINTENANCE || c.status === ContainerStatus.OFFLINE,
        );
      default:
        return containers;
    }
  }, [containers, filter]);

  const stats = useMemo(() => {
    const total = containers.length;
    const full = containers.filter((c) => c.fillLevel >= 90).length;
    const available = containers.filter(
      (c) => c.status === ContainerStatus.ACTIVE && c.fillLevel < 90,
    ).length;
    const avgFill =
      containers.reduce((sum, c) => sum + c.fillLevel, 0) / total;
    return { total, full, available, avgFill };
  }, [containers]);

  const handleContainerPress = useCallback(
    (containerId: string) => {
      navigation.navigate('ContainerDetailScreen', { containerId });
    },
    [navigation],
  );

  const renderContainerItem = useCallback(
    ({ item }: { item: Container }) => {
      const category = getFillLevelCategory(item.fillLevel);
      const fillColor = FILL_LEVEL_COLORS[category];

      return (
        <Pressable
          onPress={() => handleContainerPress(item.id)}
          style={styles.containerCard}
        >
          <View style={styles.cardHeader}>
            <View style={[styles.fillIndicator, { backgroundColor: fillColor }]}>
              <Text style={styles.fillText}>{Math.round(item.fillLevel)}%</Text>
            </View>
            <View style={styles.cardInfo}>
              <Body fontWeight="600" numberOfLines={1}>
                {item.address}
              </Body>
              <Caption color={colors.neutral[500]}>
                {item.capacity}L • {item.wasteTypes.length} tipos
              </Caption>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
          {/* Barra de llenado */}
          <View style={styles.fillBar}>
            <View
              style={[
                styles.fillBarFill,
                { width: `${item.fillLevel}%`, backgroundColor: fillColor },
              ]}
            />
          </View>
          {item.status !== ContainerStatus.ACTIVE && (
            <View style={styles.statusBadge}>
              <Caption color={colors.semantic.warning}>
                {item.status === ContainerStatus.MAINTENANCE ? '🔧 Mantenimiento' :
                 item.status === ContainerStatus.FULL ? '🔴 Lleno' :
                 '⚫ Offline'}
              </Caption>
            </View>
          )}
        </Pressable>
      );
    },
    [handleContainerPress],
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Heading level={2}>Contenedores</Heading>
          <Caption color={colors.neutral[400]}>
            Actualizado: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}
          </Caption>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.primary[600]}>
              {stats.available}
            </Body>
            <Caption color={colors.neutral[500]}>Disponibles</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.semantic.error}>
              {stats.full}
            </Body>
            <Caption color={colors.neutral[500]}>Llenos</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.neutral[700]}>
              {stats.avgFill.toFixed(0)}%
            </Body>
            <Caption color={colors.neutral[500]}>Promedio</Caption>
          </View>
        </View>

        <Spacer size="md" />

        {/* Mapa placeholder */}
        <View style={styles.mapPlaceholder}>
          <Text style={styles.mapIcon}>🗺️</Text>
          <Spacer size="sm" />
          <Body color="rgba(255,255,255,0.9)" align="center">
            Mapa interactivo
          </Body>
          <Caption color="rgba(255,255,255,0.6)" align="center">
            Requiere react-native-maps + API Key
          </Caption>
          <Spacer size="sm" />
          <View style={styles.mapMarkers}>
            {filteredContainers.slice(0, 5).map((c) => {
              const cat = getFillLevelCategory(c.fillLevel);
              return (
                <View
                  key={c.id}
                  style={[styles.mapMarker, { backgroundColor: FILL_LEVEL_COLORS[cat] }]}
                >
                  <Text style={styles.markerText}>{Math.round(c.fillLevel)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Spacer size="md" />

        {/* Filtros */}
        <View style={styles.filterRow}>
          {(['all', 'available', 'full', 'maintenance'] as FilterOption[]).map(
            (opt) => (
              <Pressable
                key={opt}
                onPress={() => setFilter(opt)}
                style={[
                  styles.filterChip,
                  filter === opt && styles.filterChipActive,
                ]}
              >
                <Caption
                  color={
                    filter === opt ? colors.primary[700] : colors.neutral[500]
                  }
                >
                  {opt === 'all'
                    ? 'Todos'
                    : opt === 'available'
                      ? 'Disponibles'
                      : opt === 'full'
                        ? 'Llenos'
                        : 'Mantenimiento'}
                </Caption>
              </Pressable>
            ),
          )}
        </View>

        <Spacer size="sm" />

        {/* Lista de contenedores */}
        <FlatList
          data={filteredContainers}
          keyExtractor={(item) => item.id}
          renderItem={renderContainerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Body color={colors.neutral[400]} align="center">
                No hay contenedores con este filtro
              </Body>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  mapPlaceholder: {
    backgroundColor: '#2C3E50',
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
  },
  mapIcon: {
    fontSize: 32,
  },
  mapMarkers: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  mapMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  markerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    backgroundColor: colors.neutral[100],
  },
  filterChipActive: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  containerCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  fillIndicator: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },
  cardInfo: {
    flex: 1,
  },
  chevron: {
    fontSize: 24,
    color: colors.neutral[400],
  },
  fillBar: {
    height: 4,
    backgroundColor: colors.neutral[200],
    borderRadius: 2,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  fillBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  statusBadge: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
});
