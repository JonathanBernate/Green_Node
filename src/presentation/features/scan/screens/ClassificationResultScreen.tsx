import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import { iotService } from '@/data/datasources/remote/mqtt/IoTService';
import { useIoTStore } from '@/presentation/store/iotStore';
import {
  WasteType,
  WASTE_TYPE_LABELS,
  WASTE_TYPE_ICONS,
  WASTE_TYPE_COLORS,
} from '@/domain/entities/WasteClassification';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type NavProp = NativeStackNavigationProp<ScanStackParamList, 'ClassificationResultScreen'>;
type RoutePropType = RouteProp<ScanStackParamList, 'ClassificationResultScreen'>;

/** Consejos personalizados por tipo de residuo */
const WASTE_TIPS: Record<WasteType, string> = {
  [WasteType.ORGANIC]:
    'Los residuos orgánicos van en la bolsa verde. Puedes compostarlos en casa para generar abono.',
  [WasteType.PLASTIC]:
    'Enjuaga el envase antes de depositarlo. Los plásticos limpios tienen mayor valor de reciclaje.',
  [WasteType.PAPER]:
    'El papel y cartón deben estar secos. No mezcles con papel plastificado o encerado.',
  [WasteType.GLASS]:
    'El vidrio es 100% reciclable infinitas veces. Deposítalo sin tapa en el contenedor blanco.',
  [WasteType.METAL]:
    'Las latas de aluminio y hojalata son muy valiosas. Aplástalas para ahorrar espacio.',
  [WasteType.SPECIAL]:
    'Los residuos especiales (pilas, electrónicos, medicamentos) requieren puntos de recolección específicos.',
};

export function ClassificationResultScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { currentResult, history, correctClassification, isLowConfidence } =
    useClassificationStore();

  // Buscar el resultado por ID
  const result = useMemo(() => {
    if (currentResult?.id === route.params.classificationId) {
      return currentResult;
    }
    return history.find((h) => h.id === route.params.classificationId) ?? null;
  }, [currentResult, history, route.params.classificationId]);

  // Publicar clasificación en la red IoT al montar
  useEffect(() => {
    if (result && !result.synced) {
      iotService.publishClassification(result).then((published) => {
        if (published) {
          useIoTStore.getState().recordPublish();
        }
      });
    }
  }, [result]);

  const handleCorrect = useCallback(
    (correctType: WasteType) => {
      if (result) {
        correctClassification(result.id, correctType);
      }
    },
    [result, correctClassification],
  );

  const handleNewScan = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  if (!result) {
    return (
      <ScreenContainer>
        <View style={styles.centered}>
          <Body>No se encontró el resultado de clasificación.</Body>
          <Spacer size="lg" />
          <ButtonPrimary onPress={handleNewScan} size="medium">
            Volver
          </ButtonPrimary>
        </View>
      </ScreenContainer>
    );
  }

  const confidencePercent = (result.confidence * 100).toFixed(1);
  const wasteColor = WASTE_TYPE_COLORS[result.wasteType];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Resultado principal */}
        <View style={[styles.resultCard, { borderColor: wasteColor }]}>
          <Text style={styles.resultIcon}>
            {WASTE_TYPE_ICONS[result.wasteType]}
          </Text>
          <Spacer size="md" />
          <Heading level={2} align="center" color={wasteColor}>
            {WASTE_TYPE_LABELS[result.wasteType]}
          </Heading>
          <Spacer size="sm" />
          {/* Barra de confianza */}
          <View style={styles.confidenceContainer}>
            <Caption color={colors.neutral[500]}>
              Confianza: {confidencePercent}%
            </Caption>
            <View style={styles.confidenceBar}>
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: `${confidencePercent}%`,
                    backgroundColor:
                      result.confidence > 0.8
                        ? colors.semantic.success
                        : result.confidence > 0.5
                          ? colors.semantic.warning
                          : colors.semantic.error,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Alerta de baja confianza */}
        {isLowConfidence && (
          <>
            <Spacer size="md" />
            <View style={styles.warningCard}>
              <Body color={colors.semantic.warning}>
                ⚠️ Confianza baja — ¿Es correcta la clasificación?
              </Body>
              <Spacer size="sm" />
              <Caption color={colors.neutral[500]}>
                Si no es correcto, selecciona el tipo adecuado abajo.
              </Caption>
            </View>
          </>
        )}

        <Spacer size="xl" />

        {/* Consejo */}
        <View style={styles.tipCard}>
          <Caption color={colors.primary[700]} fontWeight="600">
            💡 Consejo de reciclaje
          </Caption>
          <Spacer size="xs" />
          <Body color={colors.neutral[600]}>
            {WASTE_TIPS[result.wasteType]}
          </Body>
        </View>

        <Spacer size="xl" />

        {/* Corrección — solo si baja confianza o usuario quiere corregir */}
        <View style={styles.correctionSection}>
          <Caption color={colors.neutral[500]}>
            ¿No es correcto? Selecciona el tipo real:
          </Caption>
          <Spacer size="sm" />
          <View style={styles.correctionGrid}>
            {Object.values(WasteType).map((type) => (
              <Pressable
                key={type}
                onPress={() => handleCorrect(type)}
                style={[
                  styles.correctionChip,
                  type === result.wasteType && styles.correctionChipActive,
                ]}
              >
                <Text style={styles.chipIcon}>
                  {WASTE_TYPE_ICONS[type]}
                </Text>
                <Caption
                  color={
                    type === result.wasteType
                      ? colors.primary[700]
                      : colors.neutral[600]
                  }
                >
                  {WASTE_TYPE_LABELS[type]}
                </Caption>
              </Pressable>
            ))}
          </View>
        </View>

        <Spacer size="xxl" />

        {/* Acciones */}
        <ButtonPrimary onPress={handleNewScan} fullWidth size="large">
          📷  Escanear otro residuo
        </ButtonPrimary>

        <Spacer size="lg" />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  resultIcon: {
    fontSize: 56,
  },
  confidenceContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  confidenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.neutral[200],
    borderRadius: 4,
    marginTop: spacing.xs,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.warning,
  },
  tipCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  correctionSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.lg,
  },
  correctionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  correctionChip: {
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
  correctionChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.primary[50],
  },
  chipIcon: {
    fontSize: 16,
  },
});
