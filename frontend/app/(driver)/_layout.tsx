import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

export default function DriverTabLayout() {
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
        title: 'Ofertas',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="briefcase-search" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: 'Mi Perfil',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="account" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: 'Ajustes',
        tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="cog" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
