import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const EXP_OPTIONS = ['menos de 1 año', '1 a 3 años', '3 a 5 años', 'más de 5 años'];
const TRUCK_TYPES = ['frigorífico', 'lona', 'bañera', 'grúa', 'góndola', 'prancha'];

export default function RegisterDriverScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    first_name: '', last_name: '', birth_date: '', phone: '', city: '', country: 'España',
    experience_years: '', truck_types: [] as string[], accepts_loading: false,
    availability: 'inmediata', availability_date: '',
  });

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleTruckType = (type: string) => {
    setForm(prev => ({
      ...prev,
      truck_types: prev.truck_types.includes(type)
        ? prev.truck_types.filter(t => t !== type)
        : [...prev.truck_types, type],
    }));
  };

  const handleStep1 = () => {
    if (!form.email || !form.password || !form.name) { setError('Completa todos los campos'); return; }
    setError(''); setStep(2);
  };

  const handleStep2 = () => {
    if (!form.first_name || !form.last_name || !form.birth_date || !form.phone || !form.city) {
      setError('Completa todos los campos'); return;
    }
    setError(''); setStep(3);
  };

  const handleSubmit = async () => {
    if (!form.experience_years) { setError('Selecciona tu experiencia'); return; }
    if (form.truck_types.length === 0) { setError('Selecciona al menos un tipo de camión'); return; }
    setLoading(true);
    setError('');
    try {
      await register(form.email, form.password, form.name, 'driver');
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const t = await AsyncStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/drivers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t}` },
        body: JSON.stringify({
          first_name: form.first_name, last_name: form.last_name, birth_date: form.birth_date,
          phone: form.phone, email: form.email, city: form.city, country: form.country,
          experience_years: form.experience_years, truck_types: form.truck_types,
          accepts_loading: form.accepts_loading, availability: form.availability,
          availability_date: form.availability_date,
        }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error'); }
      router.replace('/(driver)');
    } catch (e: any) {
      setError(e.message || 'Error al registrarse');
    } finally { setLoading(false); }
  };

  const renderInput = (label: string, key: string, placeholder: string, opts: any = {}) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput testID={`${key}-input`} style={styles.input} value={(form as any)[key]}
        onChangeText={(v) => updateForm(key, v)} placeholder={placeholder}
        placeholderTextColor={COLORS.textDisabled} {...opts} />
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
            {[1, 2, 3].map(s => (<View key={s} style={[styles.progressDot, s <= step && styles.progressDotActive]} />))}
          </View>

          <Text style={styles.title}>
            {step === 1 ? 'Datos de Acceso' : step === 2 ? 'Datos Personales' : 'Experiencia'}
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
              {renderInput('Email', 'email', 'conductor@email.com', { keyboardType: 'email-address', autoCapitalize: 'none' })}
              {renderInput('Contraseña', 'password', '••••••••', { secureTextEntry: true })}
              <TouchableOpacity testID="next-step1-btn" style={styles.primaryBtn} onPress={handleStep1}>
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              {renderInput('Nombre', 'first_name', 'Juan')}
              {renderInput('Apellidos', 'last_name', 'García López')}
              {renderInput('Fecha de nacimiento', 'birth_date', 'DD/MM/AAAA')}
              {renderInput('Teléfono', 'phone', '+34 600 000 000', { keyboardType: 'phone-pad' })}
              {renderInput('Ciudad', 'city', 'Madrid')}
              {renderInput('País', 'country', 'España')}
              <TouchableOpacity testID="next-step2-btn" style={styles.primaryBtn} onPress={handleStep2}>
                <Text style={styles.primaryBtnText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <Text style={styles.label}>Experiencia como conductor</Text>
              <View style={styles.optionsGrid}>
                {EXP_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt} testID={`exp-${opt}`}
                    style={[styles.optionChip, form.experience_years === opt && styles.optionChipActive]}
                    onPress={() => updateForm('experience_years', opt)}>
                    <Text style={[styles.optionText, form.experience_years === opt && styles.optionTextActive]}>{opt}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>Tipo de camión utilizado</Text>
              <View style={styles.optionsGrid}>
                {TRUCK_TYPES.map(type => (
                  <TouchableOpacity key={type} testID={`truck-${type}`}
                    style={[styles.optionChip, form.truck_types.includes(type) && styles.optionChipActive]}
                    onPress={() => toggleTruckType(type)}>
                    <Text style={[styles.optionText, form.truck_types.includes(type) && styles.optionTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>¿Acepta carga y descarga con porta palets?</Text>
              <View style={styles.yesNoRow}>
                <TouchableOpacity testID="loading-yes" style={[styles.yesNoBtn, form.accepts_loading && styles.yesNoBtnActive]}
                  onPress={() => updateForm('accepts_loading', true)}>
                  <Text style={[styles.yesNoText, form.accepts_loading && styles.yesNoTextActive]}>Sí</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="loading-no" style={[styles.yesNoBtn, !form.accepts_loading && styles.yesNoBtnActive]}
                  onPress={() => updateForm('accepts_loading', false)}>
                  <Text style={[styles.yesNoText, !form.accepts_loading && styles.yesNoTextActive]}>No</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>Disponibilidad</Text>
              <View style={styles.yesNoRow}>
                <TouchableOpacity testID="avail-now" style={[styles.yesNoBtn, form.availability === 'inmediata' && styles.yesNoBtnActive]}
                  onPress={() => updateForm('availability', 'inmediata')}>
                  <Text style={[styles.yesNoText, form.availability === 'inmediata' && styles.yesNoTextActive]}>Inmediata</Text>
                </TouchableOpacity>
                <TouchableOpacity testID="avail-date" style={[styles.yesNoBtn, form.availability === 'fecha' && styles.yesNoBtnActive]}
                  onPress={() => updateForm('availability', 'fecha')}>
                  <Text style={[styles.yesNoText, form.availability === 'fecha' && styles.yesNoTextActive]}>Seleccionar fecha</Text>
                </TouchableOpacity>
              </View>
              {form.availability === 'fecha' && renderInput('Fecha disponible', 'availability_date', 'DD/MM/AAAA')}

              <TouchableOpacity testID="submit-driver-btn" style={[styles.primaryBtn, loading && styles.disabledBtn]}
                onPress={handleSubmit} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.primaryBtnText}>Registrar Conductor</Text>}
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
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  optionChipActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary },
  optionText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
  optionTextActive: { color: COLORS.white, fontWeight: '600' },
  yesNoRow: { flexDirection: 'row', gap: SPACING.sm },
  yesNoBtn: { flex: 1, height: 48, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center' },
  yesNoBtnActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary },
  yesNoText: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.textSecondary },
  yesNoTextActive: { color: COLORS.white },
  primaryBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.lg, ...SHADOWS.md },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
});
