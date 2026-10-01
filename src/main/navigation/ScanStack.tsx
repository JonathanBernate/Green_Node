import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ScanStackParamList } from '@/shared/types/navigation.types';
import { ScanScreen } from '@/presentation/features/scan/screens/ScanScreen';
import { CameraPreviewScreen } from '@/presentation/features/scan/screens/CameraPreviewScreen';
import { ClassificationResultScreen } from '@/presentation/features/scan/screens/ClassificationResultScreen';

const Stack = createStackNavigator<ScanStackParamList>();

export function ScanStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ScanScreen" component={ScanScreen} />
      <Stack.Screen name="CameraPreviewScreen" component={CameraPreviewScreen} />
      <Stack.Screen name="ClassificationResultScreen" component={ClassificationResultScreen} />
    </Stack.Navigator>
  );
}
