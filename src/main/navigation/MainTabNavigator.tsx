import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/shared/types/navigation.types';
import { ScanStack } from './ScanStack';
import { MapStack } from './MapStack';
import { HistoryScreen } from '@/presentation/features/history/screens/HistoryScreen';
import { ProfileScreen } from '@/presentation/features/profile/screens/ProfileScreen';
import { EducationScreen } from '@/presentation/features/education/screens/EducationScreen';
import { useIoTConnection } from '@/shared/hooks/useIoTConnection';
import { colors } from '@/shared/constants/colors';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>{title}</Text>
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
  // Inicializar conexión IoT/MQTT al entrar a la app autenticada
  useIoTConnection();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[500],
        tabBarInactiveTintColor: colors.neutral[400],
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="ScanTab"
        component={ScanStack}
        options={{ tabBarLabel: 'Escanear', tabBarIcon: () => <Text>📷</Text> }}
      />
      <Tab.Screen
        name="MapTab"
        component={MapStack}
        options={{ tabBarLabel: 'Mapa', tabBarIcon: () => <Text>🗺️</Text> }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryScreen}
        options={{ tabBarLabel: 'Historial', tabBarIcon: () => <Text>📋</Text> }}
      />
      <Tab.Screen
        name="EducationTab"
        component={EducationScreen}
        options={{ tabBarLabel: 'Aprender', tabBarIcon: () => <Text>📚</Text> }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Perfil', tabBarIcon: () => <Text>👤</Text> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  placeholderText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.neutral[600],
  },
  tabBar: {
    borderTopColor: colors.neutral[100],
    paddingBottom: 4,
    height: 60,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
