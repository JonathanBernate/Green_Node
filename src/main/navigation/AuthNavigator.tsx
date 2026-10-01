import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from '@/shared/types/navigation.types';
import { LoginScreen } from '@/presentation/features/auth/screens/LoginScreen';
import { RegisterScreen } from '@/presentation/features/auth/screens/RegisterScreen';
import { ForgotPasswordScreen } from '@/presentation/features/auth/screens/ForgotPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
