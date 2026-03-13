import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

export default function CompanyTabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.secondary,
      tabBarInactiveTintColor: COLORS.textTertiary,
      tabBarStyle: {
        backgroundColor: COLORS.white,
        borderTopColor: COLORS.subtle,
        height: 60,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{
        title: 'Vacantes',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase" size={size} color={color} />,
      }} />
      <Tabs.Screen name="create-job" options={{
        title: 'Publicar',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="plus-circle" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'Ajustes',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
