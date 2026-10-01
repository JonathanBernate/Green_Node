import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import { ModelStatus } from '@/infrastructure/ai/ModelManager';
import {
  WASTE_TYPE_LABELS,
  WASTE_TYPE_ICONS,
} from '@/domain/entities/WasteClassification';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type NavProp = NativeStackNavigationProp<ScanStackParamList, 'ScanScreen'>;

export function ScanScreen() {
  const navigation = useNavigation<NavProp>();
  const {
    modelStatus,
    currentResult,
    isClassifying,
    initializeModel,
  } = useClassificationStore();

  // Inicializar modelo al montar la pantalla
  useEffect(() => {
    if (modelStatus === ModelStatus.NOT_LOADED) {
      initializeModel();
    }
  }, [modelStatus, initializeModel]);

  const handleScanPress = useCallback(() => {
    if (modelStatus !== ModelStatus.READY) {
      Alert.alert(
        'Modelo no listo',
        'El modelo de clasificación aún se está cargando. Espera un momento.',
      );
      return;
    }
    navigation.navigate('CameraPreviewScreen');
  }, [navigation, modelStatus]);

  const handleResultPress = useCallback(() => {
    if (currentResult) {
      navigation.navigate('ClassificationResultScreen', {
        classificationId: currentResult.id,
      });
    }
  }, [currentResult, navigation]);

  const getModelStatusText = () => {
    switch (modelStatus) {
      case ModelStatus.LOADING:
        return '⏳ Cargando modelo de IA...';
      case ModelStatus.READY:
        return '✅ Modelo listo para clasificar';
      case ModelStatus.ERROR:
        return '❌ Error al cargar el modelo';
      default:
        return '⏸️ Modelo no inicializado';
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Heading level={1} align="center" color={colors.primary[700]}>
            Escanear Residuo
          </Heading>
          <Spacer size="sm" />
          <Body align="center" color={colors.neutral[500]}>
            Toma una foto y la IA te dirá cómo clasificarlo
          </Body>
        </View>

        <Spacer size="xxl" />

        {/* Status del modelo */}
        <View style={styles.statusCard}>
          <Caption color={colors.neutral[600]}>{getModelStatusText()}</Caption>
        </View>

        <Spacer size="xxl" />

        {/* Botón principal de escaneo */}
        <View style={styles.scanButtonContainer}>
          <ButtonPrimary
            onPress={handleScanPress}
            disabled={isClassifying || modelStatus === ModelStatus.LOADING}
            size="large"
            fullWidth
            loading={modelStatus === ModelStatus.LOADING}
          >
            {modelStatus === ModelStatus.LOADING
              ? 'Cargando modelo...'
              : '📷  Escanear Residuo'}
          </ButtonPrimary>
        </View>

        {/* Retry si hubo error */}
        {modelStatus === ModelStatus.ERROR && (
          <>
            <Spacer size="md" />
            <ButtonPrimary
              onPress={initializeModel}
              variant="outline"
              size="medium"
              fullWidth
            >
              Reintentar carga del modelo
            </ButtonPrimary>
          </>
        )}

        <Spacer size="xxl" />

        {/* Último resultado */}
        {currentResult && (
          <View style={styles.lastResult}>
            <Caption color={colors.neutral[500]}>Último resultado:</Caption>
            <Spacer size="xs" />
            <ButtonPrimary
              onPress={handleResultPress}
              variant="outline"
              size="medium"
              fullWidth
            >
              {WASTE_TYPE_ICONS[currentResult.wasteType]}{' '}
              {WASTE_TYPE_LABELS[currentResult.wasteType]} —{' '}
              {(currentResult.confidence * 100).toFixed(0)}%
            </ButtonPrimary>
          </View>
        )}

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Caption color={colors.neutral[400]} align="center">
            💡 Consejo: Coloca el residuo sobre un fondo neutro y con buena
            iluminación para mejores resultados.
          </Caption>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
  },
  header: {
    alignItems: 'center',
  },
  statusCard: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  scanButtonContainer: {
    alignItems: 'center',
  },
  lastResult: {
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  tipsSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: spacing.xl,
  },
});
