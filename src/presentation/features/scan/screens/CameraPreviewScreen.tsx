import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ScanStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useClassificationStore } from '@/presentation/store/classificationStore';
import { cameraService } from '@/infrastructure/camera/CameraService';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type NavProp = NativeStackNavigationProp<ScanStackParamList, 'CameraPreviewScreen'>;

export function CameraPreviewScreen() {
  const navigation = useNavigation<NavProp>();
  const { classifyImage, isClassifying } = useClassificationStore();

  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);

  const handleCapture = useCallback(async () => {
    try {
      const photo = await cameraService.capturePhoto();
      setCapturedUri(photo.uri);
    } catch (error) {
      // TODO: Mostrar error en UI
    }
  }, []);

  const handleClassify = useCallback(async () => {
    if (!capturedUri) return;

    try {
      const result = await classifyImage(capturedUri);
      navigation.replace('ClassificationResultScreen', {
        classificationId: result.id,
      });
    } catch (error) {
      // Error manejado por el store
    }
  }, [capturedUri, classifyImage, navigation]);

  const handleRetake = useCallback(() => {
    setCapturedUri(null);
  }, []);

  const handleToggleFlash = useCallback(() => {
    const newState = cameraService.toggleFlash();
    setFlashEnabled(newState);
  }, []);

  // Si ya se capturó la foto, mostrar preview con opciones
  if (capturedUri) {
    return (
      <ScreenContainer>
        <View style={styles.container}>
          {/* Preview de la imagen capturada */}
          <View style={styles.previewContainer}>
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderIcon}>🖼️</Text>
              <Spacer size="sm" />
              <Caption color={colors.neutral[500]}>Imagen capturada</Caption>
              <Caption color={colors.neutral[400]}>{capturedUri}</Caption>
            </View>
          </View>

          <Spacer size="xl" />

          {/* Acciones */}
          <View style={styles.actions}>
            <ButtonPrimary
              onPress={handleClassify}
              fullWidth
              size="large"
              loading={isClassifying}
            >
              {isClassifying ? 'Clasificando...' : '🧠  Clasificar con IA'}
            </ButtonPrimary>

            <Spacer size="md" />

            <ButtonPrimary
              onPress={handleRetake}
              variant="outline"
              fullWidth
              size="medium"
              disabled={isClassifying}
            >
              📷  Tomar otra foto
            </ButtonPrimary>

            <Spacer size="md" />

            <ButtonPrimary
              onPress={() => navigation.goBack()}
              variant="ghost"
              fullWidth
              size="medium"
              disabled={isClassifying}
            >
              Cancelar
            </ButtonPrimary>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  // Vista de la cámara
  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Simula la vista de la cámara */}
        <View style={styles.cameraView}>
          <View style={styles.cameraPlaceholder}>
            <Text style={styles.cameraIcon}>📷</Text>
            <Spacer size="md" />
            <Body color="#FFF" align="center">
              Vista de la cámara
            </Body>
            <Spacer size="xs" />
            <Caption color="rgba(255,255,255,0.7)" align="center">
              Centra el residuo dentro del recuadro
            </Caption>
          </View>

          {/* Overlay con guía cuadrada */}
          <View style={styles.overlay}>
            <View style={styles.guideBorder} />
          </View>
        </View>

        {/* Controles inferiores */}
        <View style={styles.bottomControls}>
          {/* Flash toggle */}
          <Pressable onPress={handleToggleFlash} style={styles.controlButton}>
            <Text style={styles.controlIcon}>
              {flashEnabled ? '⚡' : '💡'}
            </Text>
            <Caption color={colors.neutral[600]}>
              {flashEnabled ? 'Flash ON' : 'Flash OFF'}
            </Caption>
          </Pressable>

          {/* Botón de captura */}
          <Pressable onPress={handleCapture} style={styles.captureButton}>
            <View style={styles.captureButtonInner} />
          </Pressable>

          {/* Cerrar */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.controlButton}
          >
            <Text style={styles.controlIcon}>✕</Text>
            <Caption color={colors.neutral[600]}>Cerrar</Caption>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraView: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    margin: spacing.md,
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 64,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBorder: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 16,
    borderStyle: 'dashed',
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  controlButton: {
    alignItems: 'center',
    gap: 4,
  },
  controlIcon: {
    fontSize: 24,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    borderWidth: 4,
    borderColor: colors.primary[500],
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    backgroundColor: colors.primary[500],
  },
  previewContainer: {
    flex: 1,
    margin: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  placeholderIcon: {
    fontSize: 48,
  },
  actions: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
});
