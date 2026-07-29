import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { MapStackParamList } from '@/shared/types/navigation.types';
import { MapScreen } from '@/presentation/features/map/screens/MapScreen';
import { ContainerDetailScreen } from '@/presentation/features/map/screens/ContainerDetailScreen';

const Stack = createStackNavigator<MapStackParamList>();

export function MapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="ContainerDetailScreen" component={ContainerDetailScreen} />
    </Stack.Navigator>
  );
}
