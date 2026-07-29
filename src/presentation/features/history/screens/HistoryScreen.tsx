import React, { useMemo } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import {
  WASTE_TYPE_LABELS,
  WASTE_TYPE_ICONS,
  WASTE_TYPE_COLORS,
  WasteType,
} from '@/domain/entities/WasteClassification';
import type { ClassificationResult } from '@/domain/entities/WasteClassification';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

export function HistoryScreen() {
  const history = useClassificationStore((s) => s.history);

  const stats = useMemo(() => {
    const total = history.length;
    const byType = Object.values(WasteType).reduce(
      (acc, type) => {
        acc[type] = history.filter((h) => h.wasteType === type).length;
        return acc;
      },
      {} as Record<WasteType, number>,
    );
    const avgConfidence =
      total > 0
        ? history.reduce((sum, h) => sum + h.confidence, 0) / total
        : 0;
    return { total, byType, avgConfidence };
  }, [history]);

  const renderItem = ({ item }: { item: ClassificationResult }) => (
    <View style={styles.historyItem}>
      <View
        style={[
          styles.itemIcon,
          { backgroundColor: WASTE_TYPE_COLORS[item.wasteType] + '20' },
        ]}
      >
        <Text style={styles.iconText}>{WASTE_TYPE_ICONS[item.wasteType]}</Text>
      </View>
      <View style={styles.itemContent}>
        <Body fontWeight="600">{WASTE_TYPE_LABELS[item.wasteType]}</Body>
        <Caption color={colors.neutral[400]}>
          {new Date(item.timestamp).toLocaleString()} •{' '}
          {(item.confidence * 100).toFixed(0)}% confianza
        </Caption>
      </View>
      <View
        style={[
          styles.syncBadge,
          { backgroundColor: item.synced ? colors.semantic.success + '20' : colors.neutral[200] },
        ]}
      >
        <Caption
          color={item.synced ? colors.semantic.success : colors.neutral[500]}
        >
          {item.synced ? '✓' : '⏳'}
        </Caption>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <Heading level={2}>Historial</Heading>
        <Spacer size="md" />

        {/* Stats rápidos */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.primary[600]}>
              {stats.total}
            </Body>
            <Caption color={colors.neutral[500]}>Total</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.neutral[700]}>
              {(stats.avgConfidence * 100).toFixed(0)}%
            </Body>
            <Caption color={colors.neutral[500]}>Confianza</Caption>
          </View>
          <View style={styles.statCard}>
            <Body fontWeight="700" color={colors.semantic.success}>
              +{stats.total * 10}
            </Body>
            <Caption color={colors.neutral[500]}>Puntos</Caption>
          </View>
        </View>

        <Spacer size="lg" />

        {/* Lista */}
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Spacer size="md" />
              <Body color={colors.neutral[400]} align="center">
                Aún no has clasificado residuos
              </Body>
              <Caption color={colors.neutral[300]} align="center">
                Escanea tu primer residuo en la pestaña "Escanear"
              </Caption>
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
  listContent: {
    paddingBottom: spacing.xxl,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing.md,
  },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  syncBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing.huge,
  },
  emptyIcon: {
    fontSize: 48,
  },
});
