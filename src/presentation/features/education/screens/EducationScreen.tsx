import React from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

interface LessonItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  duration: string;
  completed: boolean;
}

const LESSONS: LessonItem[] = [
  {
    id: '1',
    title: '¿Qué va en cada bolsa?',
    description: 'Aprende el código de colores para separar residuos en Colombia',
    icon: '🎨',
    duration: '60s',
    completed: false,
  },
  {
    id: '2',
    title: 'Plásticos: no todos se reciclan',
    description: 'Diferencia entre PET, HDPE y plásticos no reciclables',
    icon: '♻️',
    duration: '90s',
    completed: false,
  },
  {
    id: '3',
    title: 'Residuos orgánicos y compostaje',
    description: 'Cómo aprovechar los residuos orgánicos en casa',
    icon: '🌱',
    duration: '75s',
    completed: false,
  },
  {
    id: '4',
    title: 'Residuos especiales y peligrosos',
    description: 'Pilas, electrónicos y medicamentos: puntos de recolección',
    icon: '⚠️',
    duration: '60s',
    completed: false,
  },
  {
    id: '5',
    title: 'El vidrio es infinitamente reciclable',
    description: 'Por qué el vidrio es el material más sostenible',
    icon: '🥛',
    duration: '45s',
    completed: false,
  },
  {
    id: '6',
    title: 'Impacto del reciclaje en Bogotá',
    description: 'Cifras de residuos y el rol de los recicladores de oficio',
    icon: '🏙️',
    duration: '90s',
    completed: false,
  },
];

export function EducationScreen() {
  const renderItem = ({ item }: { item: LessonItem }) => (
    <View style={styles.lessonCard}>
      <View style={styles.lessonIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.lessonContent}>
        <Body fontWeight="600">{item.title}</Body>
        <Caption color={colors.neutral[500]}>{item.description}</Caption>
        <Spacer size="xs" />
        <View style={styles.metaRow}>
          <Caption color={colors.neutral[400]}>⏱️ {item.duration}</Caption>
          {item.completed && (
            <Caption color={colors.semantic.success}>✓ Completada</Caption>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <Heading level={2}>Aprender</Heading>
        <Spacer size="xs" />
        <Body color={colors.neutral[500]}>
          Micro-lecciones sobre separación y reciclaje
        </Body>
        <Spacer size="lg" />

        {/* Progreso */}
        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Body fontWeight="700">0 / {LESSONS.length}</Body>
            <Caption color={colors.neutral[400]}>lecciones completadas</Caption>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '0%' }]} />
          </View>
        </View>

        <Spacer size="lg" />

        <FlatList
          data={LESSONS}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
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
  progressCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 14,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  lessonCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    gap: spacing.md,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  lessonContent: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
