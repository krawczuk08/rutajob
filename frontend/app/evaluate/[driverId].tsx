import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const CRITERIA = [
  { key: 'commitment', label: 'Compromiso', icon: 'handshake' },
  { key: 'responsibility', label: 'Responsabilidad', icon: 'shield-check' },
  { key: 'document_accuracy', label: 'Veracidad documentos', icon: 'file-check' },
  { key: 'punctuality', label: 'Puntualidad', icon: 'clock-check' },
];

export default function EvaluateScreen() {
  const router = useRouter();
  const { driverId } = useLocalSearchParams<{ driverId: string }>();
  const { token } = useAuth();
  const [scores, setScores] = useState<Record<string, number>>({
    commitment: 5, responsibility: 5, document_accuracy: 5, punctuality: 5,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const setScore = (key: string, value: number) => setScores(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ driver_id: driverId, ...scores }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error'); }
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Error al evaluar');
    } finally { setLoading(false); }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successView}>
          <MaterialCommunityIcons name="check-circle" size={80} color={COLORS.success} />
          <Text style={styles.successTitle}>Evaluación Enviada</Text>
          <TouchableOpacity style={styles.backToBtn} onPress={() => router.back()}>
            <Text style={styles.backToBtnText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Evaluar Conductor</Text>
        <Text style={styles.subtitle}>Puntúa de 0 a 10 en cada categoría</Text>

        {error ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={20} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {CRITERIA.map(crit => (
          <View key={crit.key} style={styles.criteriaCard}>
            <View style={styles.criteriaHeader}>
              <MaterialCommunityIcons name={crit.icon as any} size={24} color={COLORS.secondary} />
              <Text style={styles.criteriaLabel}>{crit.label}</Text>
              <Text style={[styles.criteriaScore, {
                color: scores[crit.key] >= 7 ? COLORS.success : scores[crit.key] >= 4 ? COLORS.warning : COLORS.error
              }]}>{scores[crit.key]}</Text>
            </View>
            <View style={styles.scoreRow}>
              {Array.from({ length: 11 }, (_, i) => (
                <TouchableOpacity key={i} testID={`score-${crit.key}-${i}`}
                  style={[styles.scoreBtn, i === scores[crit.key] && styles.scoreBtnActive,
                    i === scores[crit.key] && {
                      backgroundColor: i >= 7 ? COLORS.success : i >= 4 ? COLORS.warning : COLORS.error
                    }]}
                  onPress={() => setScore(crit.key, i)}>
                  <Text style={[styles.scoreBtnText, i === scores[crit.key] && styles.scoreBtnTextActive]}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Media Total</Text>
          <Text style={styles.summaryScore}>
            {((scores.commitment + scores.responsibility + scores.document_accuracy + scores.punctuality) / 4).toFixed(1)}
          </Text>
        </View>

        <TouchableOpacity testID="submit-eval-btn" style={[styles.submitBtn, loading && styles.disabledBtn]}
          onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> :
            <Text style={styles.submitBtnText}>Enviar Evaluación</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, height: 44 },
  backText: { ...TYPOGRAPHY.bodyMd, color: COLORS.primary },
  title: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginTop: SPACING.md },
  subtitle: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary, marginTop: SPACING.xs, marginBottom: SPACING.lg },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, gap: SPACING.sm },
  errorText: { ...TYPOGRAPHY.bodySm, color: COLORS.error, flex: 1 },
  criteriaCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  criteriaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  criteriaLabel: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary, flex: 1, marginLeft: SPACING.sm },
  criteriaScore: { ...TYPOGRAPHY.h3, fontWeight: '700' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between' },
  scoreBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.subtle },
  scoreBtnActive: { backgroundColor: COLORS.secondary },
  scoreBtnText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  scoreBtnTextActive: { color: COLORS.white, fontWeight: '700' },
  summaryCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.md },
  summaryLabel: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.white },
  summaryScore: { ...TYPOGRAPHY.h2, color: COLORS.secondary },
  submitBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.md },
  disabledBtn: { opacity: 0.7 },
  submitBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
  successView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  successTitle: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginTop: SPACING.lg },
  backToBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, marginTop: SPACING.lg },
  backToBtnText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.white },
});
