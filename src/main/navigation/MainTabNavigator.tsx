import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/shared/types/navigation.types';
import { colors } from '@/shared/constants/colors';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholder}>
    <Text style={styles.placeholderText}>{title}</Text>
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabNavigator() {
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
        options={{ tabBarLabel: 'Escanear', tabBarIcon: () => <Text>📷</Text> }}
      >
        {() => <PlaceholderScreen title="Escanear" />}
      </Tab.Screen>
      <Tab.Screen
        name="MapTab"
        options={{ tabBarLabel: 'Mapa', tabBarIcon: () => <Text>🗺️</Text> }}
      >
        {() => <PlaceholderScreen title="Mapa" />}
      </Tab.Screen>
      <Tab.Screen
        name="HistoryTab"
        options={{ tabBarLabel: 'Historial', tabBarIcon: () => <Text>📋</Text> }}
      >
        {() => <PlaceholderScreen title="Historial" />}
      </Tab.Screen>
      <Tab.Screen
        name="EducationTab"
        options={{ tabBarLabel: 'Aprender', tabBarIcon: () => <Text>📚</Text> }}
      >
        {() => <PlaceholderScreen title="Aprender" />}
      </Tab.Screen>
      <Tab.Screen
        name="ProfileTab"
        options={{ tabBarLabel: 'Perfil', tabBarIcon: () => <Text>👤</Text> }}
      >
        {() => <PlaceholderScreen title="Perfil" />}
      </Tab.Screen>
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
