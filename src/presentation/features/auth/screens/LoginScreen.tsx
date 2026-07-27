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
import { AuthRepositoryImpl } from '@/data/repositories/AuthRepositoryImpl';
import { ApiError } from '@/data/datasources/remote/api/apiClient';
import { colors } from '@/shared/constants/colors';
import { spacing } from '@/shared/constants/spacing';
import { typography } from '@/shared/constants/typography';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;
const authRepository = new AuthRepositoryImpl();

export function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const login = useAuthStore((s) => s.login);
  const clearPersistedData = useAuthStore((s) => s.clearPersistedData);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = useCallback(() => {
    const newErrors: { email?: string; password?: string } = {};
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      console.log('[Login] Calling API...');
      const result = await authRepository.login(email.trim(), password);
      console.log('[Login] API response:', JSON.stringify(result));
      login(result.user, { accessToken: result.token, refreshToken: result.token });
      console.log('[Login] Store updated');
    } catch (error) {
      console.log('[Login] Error:', error);
      const message =
        error instanceof ApiError
          ? error.message
          : 'Error al conectar con el servidor';
      setErrors({ general: message });
    } finally {
      setLoading(false);
    }
  }, [email, password, login, validate]);

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
          {/* Header / Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>♻️</Text>
            </View>
            <Spacer size="lg" />
            <Heading level={1} align="center" color={colors.primary[700]}>
              GreenNode
            </Heading>
            <Spacer size="xs" />
            <Body align="center" color={colors.neutral[500]}>
              Gestión inteligente de residuos
            </Body>
          </View>

          <Spacer size="xxl" />

          {/* Form */}
          <View style={styles.formSection}>
            <Heading level={3} align="center">
              Iniciar Sesión
            </Heading>
            <Spacer size="xl" />

            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!showPassword}
                error={errors.password}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showPasswordBtn}
              >
                <Caption color={colors.primary[500]}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Caption>
              </Pressable>
            </View>

            {errors.general && (
              <View style={styles.generalError}>
                <Caption color={colors.semantic.error}>{errors.general}</Caption>
              </View>
            )}

            <Pressable
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}
            >
              <Caption color={colors.primary[500]}>
                ¿Olvidaste tu contraseña?
              </Caption>
            </Pressable>

            <Spacer size="lg" />

            <ButtonPrimary
              onPress={handleLogin}
              fullWidth
              size="large"
              loading={loading}
            >
              Iniciar Sesión
            </ButtonPrimary>

            <Spacer size="xl" />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Caption color={colors.neutral[400]}>o</Caption>
              <View style={styles.dividerLine} />
            </View>

            <Spacer size="xl" />

            
          </View>

          <Spacer size="xl" />

          {/* Footer */}
          <View style={styles.footer}>
            <Body color={colors.neutral[500]} align="center">
              ¿No tienes cuenta?{' '}
            </Body>
            <Pressable onPress={() => navigation.navigate('Register')}>
              <Body color={colors.primary[500]} fontWeight="600">
                Regístrate aquí
              </Body>
            </Pressable>
          </View>

          <Spacer size="lg" />

          {/* Debug: limpiar datos viejos */}
          <Pressable
            onLongPress={async () => {
              await clearPersistedData();
              console.log('[Login] Persisted data cleared');
            }}
            style={styles.debugClear}
          >
            <Caption color={colors.neutral[400]}>
              (mantén presionado para limpiar datos)
            </Caption>
          </Pressable>

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
  logoSection: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary[100],
  },
  logoIcon: {
    fontSize: 40,
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
  passwordContainer: {
    position: 'relative',
  },
  showPasswordBtn: {
    position: 'absolute',
    right: 0,
    top: 36,
    padding: spacing.xs,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  generalError: {
    backgroundColor: '#FEF2F2',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugClear: {
    padding: spacing.sm,
  },
});
