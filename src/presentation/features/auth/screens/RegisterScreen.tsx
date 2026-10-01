import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/shared/types/navigation.types';
import { ScreenContainer } from '@/presentation/components/layout/ScreenContainer';
import { Spacer } from '@/presentation/components/layout/Spacer';
import { Heading } from '@/presentation/components/ui/Typography/Heading';
import { Body } from '@/presentation/components/ui/Typography/Body';
import { Caption } from '@/presentation/components/ui/Typography/Caption';
import { TextInput } from '@/presentation/components/ui/Input/TextInput';
import { ButtonPrimary } from '@/presentation/components/ui/Button/ButtonPrimary';
import { useAuthStore } from '@/presentation/store/authStore';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterScreen() {
  const navigation = useNavigation<NavProp>();
  const { registerUser, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Mínimo 2 caracteres';
    }

    if (!email.trim()) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Ingresa un correo válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    if (!validate()) return;
    clearError();
    try {
      await registerUser({
        name: name.trim(),
        email: email.trim(),
        password,
        neighborhood: neighborhood.trim() || undefined,
      });
    } catch {
      // Error manejado por el store
    }
  }, [name, email, password, neighborhood, registerUser, validate, clearError]);

  return (
    <ScreenContainer safeAreaBottom={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>🌱</Text>
            </View>
            <Spacer size="lg" />
            <Heading level={2} align="center" color={colors.primary[700]}>
              Crear Cuenta
            </Heading>
            <Spacer size="xs" />
            <Body align="center" color={colors.neutral[500]}>
              Únete a la comunidad GreenNode
            </Body>
          </View>

          <Spacer size="xl" />

          {/* Form */}
          <View style={styles.formSection}>
            {/* Error global */}
            {error && (
              <>
                <View style={styles.errorBanner}>
                  <Body color={colors.semantic.error}>{error}</Body>
                </View>
                <Spacer size="md" />
              </>
            )}

            <TextInput
              label="Nombre completo"
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              autoCapitalize="words"
              error={errors.name}
            />

            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <TextInput
              label="Contraseña"
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              secureTextEntry
              error={errors.password}
            />

            <TextInput
              label="Confirmar contraseña"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              secureTextEntry
              error={errors.confirmPassword}
            />

            <TextInput
              label="Barrio / Localidad (opcional)"
              value={neighborhood}
              onChangeText={setNeighborhood}
              placeholder="Ej: Kennedy, Suba, Engativá"
              autoCapitalize="words"
            />

            <Spacer size="lg" />

            <ButtonPrimary
              onPress={handleRegister}
              fullWidth
              size="large"
              loading={isLoading}
            >
              Crear Cuenta
            </ButtonPrimary>

            <Spacer size="md" />

            <Caption color={colors.neutral[400]} align="center">
              Al registrarte aceptas nuestros términos y condiciones y nuestra
              política de privacidad
            </Caption>
          </View>

          <Spacer size="xl" />

          {/* Footer */}
          <View style={styles.footer}>
            <Body color={colors.neutral[500]} align="center">
              ¿Ya tienes cuenta?{' '}
            </Body>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Body color={colors.primary[500]} fontWeight="600">
                Inicia sesión
              </Body>
            </Pressable>
          </View>

          <Spacer size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[100],
  },
  logoIcon: {
    fontSize: 32,
  },
  formSection: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.semantic.error,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
