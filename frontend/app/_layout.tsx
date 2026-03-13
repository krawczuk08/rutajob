import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register-company" />
        <Stack.Screen name="register-driver" />
        <Stack.Screen name="(company)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="job/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="candidates/[jobId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="driver-view/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="evaluate/[driverId]" options={{ presentation: 'card' }} />
      </Stack>
    </AuthProvider>
  );
}
