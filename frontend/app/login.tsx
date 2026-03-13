import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: string }>();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isCompany = role === 'company';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      if (isCompany) {
        router.replace('/(company)');
      } else {
        router.replace('/(driver)');
      }
    } catch (e: any) {
      setError(e.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (isCompany) {
      router.push('/register-company');
    } else {
      router.push('/register-driver');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <MaterialCommunityIcons
              name={isCompany ? 'domain' : 'steering'}
              size={48}
              color={COLORS.secondary}
            />
            <Text style={styles.title}>
              {isCompany ? 'Acceso Empresa' : 'Acceso Conductor'}
            </Text>
            <Text style={styles.subtitle}>Inicia sesión o crea una cuenta</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              testID="email-input"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.textDisabled}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                testID="password-input"
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textDisabled}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="login-btn"
              style={[styles.primaryBtn, loading && styles.disabledBtn]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              testID="register-btn"
              style={styles.secondaryBtn}
              onPress={handleRegister}
            >
              <Text style={styles.secondaryBtnText}>
                {isCompany ? 'Registrar Empresa' : 'Registrar Conductor'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: SPACING.containerPadding, paddingBottom: SPACING.xl },
  backBtn: { marginTop: SPACING.md, width: 44, height: 44, justifyContent: 'center' },
  header: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.xl },
  title: { ...TYPOGRAPHY.h2, color: COLORS.primary, marginTop: SPACING.md },
  subtitle: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary, marginTop: SPACING.xs },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error, flex: 1 },
  form: { gap: SPACING.xs },
  label: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    height: 56,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.textPrimary,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 56 },
  passwordInput: { flex: 1, height: 56, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.bodyMd, color: COLORS.textPrimary },
  eyeBtn: { paddingHorizontal: SPACING.md },
  primaryBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary, marginHorizontal: SPACING.md },
  secondaryBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.primary },
});
