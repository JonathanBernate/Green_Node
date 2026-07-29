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

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<NavProp>();
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [sent, setSent] = useState(false);

  const validate = useCallback((): boolean => {
    if (!email.trim()) {
      setEmailError('El correo es obligatorio');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Ingresa un correo válido');
      return false;
    }
    setEmailError(undefined);
    return true;
  }, [email]);

  const handleResetPassword = useCallback(async () => {
    if (!validate()) return;
    clearError();
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch {
      // Error manejado por el store
    }
  }, [email, resetPassword, validate, clearError]);

  if (sent) {
    return (
      <ScreenContainer>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Text style={styles.iconText}>✉️</Text>
          </View>
          <Spacer size="xl" />
          <Heading level={2} align="center">
            Correo enviado
          </Heading>
          <Spacer size="md" />
          <Body align="center" color={colors.neutral[500]}>
            Revisa tu bandeja de entrada en{'\n'}
            <Body fontWeight="600">{email.trim()}</Body>
            {'\n'}y sigue las instrucciones para restablecer tu contraseña.
          </Body>
          <Spacer size="xxl" />
          <ButtonPrimary
            onPress={() => navigation.navigate('Login')}
            fullWidth
            size="large"
          >
            Volver al inicio de sesión
          </ButtonPrimary>
        </View>
      </ScreenContainer>
    );
  }

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
              <Text style={styles.iconText}>🔑</Text>
            </View>
            <Spacer size="lg" />
            <Heading level={2} align="center">
              Recuperar Contraseña
            </Heading>
            <Spacer size="sm" />
            <Body align="center" color={colors.neutral[500]}>
              Ingresa tu correo electrónico y te enviaremos un enlace para
              restablecer tu contraseña
            </Body>
          </View>

          <Spacer size="xxl" />

          {/* Form */}
          <View style={styles.formSection}>
            {error && (
              <>
                <View style={styles.errorBanner}>
                  <Body color={colors.semantic.error}>{error}</Body>
                </View>
                <Spacer size="md" />
              </>
            )}

            <TextInput
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />

            <Spacer size="lg" />

            <ButtonPrimary
              onPress={handleResetPassword}
              fullWidth
              size="large"
              loading={isLoading}
            >
              Enviar enlace de recuperación
            </ButtonPrimary>
          </View>

          <Spacer size="xl" />

          {/* Back to login */}
          <Pressable
            onPress={() => navigation.navigate('Login')}
            style={styles.backLink}
          >
            <Caption color={colors.primary[500]}>
              ← Volver al inicio de sesión
            </Caption>
          </Pressable>
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
  iconText: {
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
  backLink: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.primary[100],
  },
});
