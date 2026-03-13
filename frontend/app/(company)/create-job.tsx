import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const LOCATION_TYPES = ['local', 'nacional', 'internacional'];
const JOB_TYPES = ['frigorífico', 'lona', 'bañera', 'grúa móvil', 'prancha', 'góndola', 'cisterna - alimentar', 'cisterna - materia peligrosa'];

export default function CreateJobScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    location_type: '', start_time: '', salary: '', job_type: '', description: '',
  });

  const updateForm = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (!form.location_type || !form.start_time || !form.salary || !form.job_type) {
      setError('Completa todos los campos obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...form, salary: parseFloat(form.salary) }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error'); }
      setSuccess(true);
      setTimeout(() => { router.push('/(company)'); }, 1500);
    } catch (e: any) {
      setError(e.message || 'Error al publicar');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successView}>
          <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.success} />
          <Text style={styles.successTitle}>¡Vacante Publicada!</Text>
          <Text style={styles.successDesc}>Los conductores cercanos podrán ver tu oferta</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Publicar Vacante</Text>
          <Text style={styles.subtitle}>Los conductores en un radio de 25 km verán tu oferta</Text>

          {error ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Localización del trabajo</Text>
          <View style={styles.chipRow}>
            {LOCATION_TYPES.map(type => (
              <TouchableOpacity key={type} testID={`loc-${type}`}
                style={[styles.chip, form.location_type === type && styles.chipActive]}
                onPress={() => updateForm('location_type', type)}>
                <Text style={[styles.chipText, form.location_type === type && styles.chipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Tipo de trabajo</Text>
          <View style={styles.chipRow}>
            {JOB_TYPES.map(type => (
              <TouchableOpacity key={type} testID={`type-${type}`}
                style={[styles.chip, form.job_type === type && styles.chipActive]}
                onPress={() => updateForm('job_type', type)}>
                <Text style={[styles.chipText, form.job_type === type && styles.chipTextActive]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Hora de inicio del turno</Text>
          <TextInput testID="start-time-input" style={styles.input} value={form.start_time}
            onChangeText={v => updateForm('start_time', v)} placeholder="Ej: 06:00" placeholderTextColor={COLORS.textDisabled} />

          <Text style={styles.label}>Salario líquido (€)</Text>
          <TextInput testID="salary-input" style={styles.input} value={form.salary}
            onChangeText={v => updateForm('salary', v)} placeholder="Ej: 2500" placeholderTextColor={COLORS.textDisabled} keyboardType="numeric" />

          <Text style={styles.label}>Descripción adicional</Text>
          <TextInput testID="description-input" style={[styles.input, styles.textArea]} value={form.description}
            onChangeText={v => updateForm('description', v)} placeholder="Detalles del trabajo..."
            placeholderTextColor={COLORS.textDisabled} multiline numberOfLines={4} textAlignVertical="top" />

          <TouchableOpacity testID="publish-job-btn" style={[styles.primaryBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> :
              <Text style={styles.primaryBtnText}>Publicar Vacante</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  title: { ...TYPOGRAPHY.h3, color: COLORS.primary },
  subtitle: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error, flex: 1 },
  label: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.sm, marginTop: SPACING.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.full, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.white },
  chipActive: { borderColor: COLORS.secondary, backgroundColor: COLORS.secondary },
  chipText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
  chipTextActive: { color: COLORS.white, fontWeight: '600' },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, height: 56, paddingHorizontal: SPACING.md, ...TYPOGRAPHY.bodyMd, color: COLORS.textPrimary },
  textArea: { height: 100, paddingTop: SPACING.md },
  primaryBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.md },
  disabledBtn: { opacity: 0.7 },
  primaryBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
  successView: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  successTitle: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginTop: SPACING.lg },
  successDesc: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary, marginTop: SPACING.sm, textAlign: 'center' },
});
