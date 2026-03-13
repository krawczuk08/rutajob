import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function RegisterCompanyScreen() {
  const router = useRouter();
  const { register, token } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '', company_name: '', cif_nif: '',
    address: '', city: '', country: 'España', phone: '', contact_person: '',
    iban: '', debit_authorized: false,
  });

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleStep1 = () => {
    if (!form.email || !form.password || !form.name) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleStep2 = () => {
    if (!form.company_name || !form.cif_nif || !form.address || !form.city || !form.phone || !form.contact_person) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setError('');
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!form.iban) { setError('El IBAN es obligatorio'); return; }
    if (!form.debit_authorized) { setError('Debe aceptar la autorización de débito'); return; }
    setLoading(true);
    setError('');
    try {
      await register(form.email, form.password, form.name, 'company');
      // Now create company profile
      const storedToken = token;
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const t = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({
          company_name: form.company_name, cif_nif: form.cif_nif,
          address: form.address, city: form.city, country: form.country,
          phone: form.phone, email: form.email, contact_person: form.contact_person,
          iban: form.iban, debit_authorized: form.debit_authorized,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error al crear empresa');
      }
      router.replace('/(company)');
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, key: string, placeholder: string, opts: any = {}) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={`${key}-input`}
        style={styles.input}
        value={(form as any)[key]}
        onChangeText={(v) => updateForm(key, v)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textDisabled}
        {...opts}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : router.back()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <View style={styles.progressRow}>
            {[1, 2, 3].map(s => (
              <View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />
            ))}
          </View>

          <Text style={styles.title}>
            {step === 1 ? 'Datos de Acceso' : step === 2 ? 'Datos de Empresa' : 'Datos de Pago'}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === 1 && (
            <View style={styles.form}>
              {renderInput('Nombre completo', 'name', 'Tu nombre')}
              {renderInput('Email', 'email', 'empresa@email.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {renderInput('Contraseña', 'password', '••••••••', { secureTextEntry: true })}
              <TouchableOpacity testID="next-step1-btn" style={styles.primaryBtn} onPress={handleStep1}>
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              {renderInput('Nombre de Empresa', 'company_name', 'Transportes S.L.')}
              {renderInput('CIF/NIF', 'cif_nif', 'B12345678')}
              {renderInput('Dirección', 'address', 'Calle Mayor 1')}
              {renderInput('Ciudad', 'city', 'Madrid')}
              {renderInput('País', 'country', 'España')}
              {renderInput('Teléfono', 'phone', '+34 600 000 000', { keyboardType: 'phone-pad' })}
              {renderInput('Persona de contacto', 'contact_person', 'Juan Pérez')}
              <TouchableOpacity testID="next-step2-btn" style={styles.primaryBtn} onPress={handleStep2}>
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              {renderInput('IBAN cuenta bancaria', 'iban', 'ES00 0000 0000 0000 0000 0000')}
              <View style={styles.authBox}>
                <Text style={styles.authText}>
                  La empresa autoriza a Ruta Job a debitar automáticamente la cantidad de 7,35 € cada 30 días desde la cuenta bancaria indicada como suscripción al servicio.
                </Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Acepto la autorización</Text>
                  <Switch
                    testID="debit-switch"
                    value={form.debit_authorized}
                    onValueChange={(v) => updateForm('debit_authorized', v)}
                    trackColor={{ false: COLORS.border, true: COLORS.success }}
                    thumbColor={COLORS.white}
                  />
                </View>
              </View>
              <TouchableOpacity
                testID="submit-company-btn"
                style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Registrar Empresa</Text>}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.containerPadding, paddingBottom: SPACING.xl },
  backBtn: { marginTop: SPACING.md, width: 44, height: 44, justifyContent: 'center' },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md, marginBottom: SPACING.lg },
  progressDot: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  progressDotActive: { backgroundColor: COLORS.secondary },
  title: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginBottom: SPACING.lg },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error, flex: 1 },
  form: { gap: SPACING.xs },
  label: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 56, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.bodyMd, color: COLORS.textPrimary },
  authBox: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.warning },
  authText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary, lineHeight: 20 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  switchLabel: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary },
  primaryBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, ...SHADOWS.md },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
});
