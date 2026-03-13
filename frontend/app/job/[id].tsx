import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function JobDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchJob();
    checkIfApplied();
  }, [id]);

  const fetchJob = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setJob(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const checkIfApplied = async () => {
    if (user?.role !== 'driver') return;
    try {
      const res = await fetch(`${API_URL}/api/applications/driver`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const apps = await res.json();
        setApplied(apps.some((a: any) => a.job_id === id));
      }
    } catch (e) {}
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      const res = await fetch(`${API_URL}/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ job_id: id }),
      });
      if (res.ok) setApplied(true);
      else {
        const err = await res.json();
        if (err.detail?.includes('Ya has aplicado')) setApplied(true);
      }
    } catch (e) { console.error(e); }
    finally { setApplying(false); }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;
  if (!job) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.errorText}>Vacante no encontrada</Text></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <Text style={styles.jobType}>{job.job_type}</Text>
          <Text style={styles.companyName}>{job.company_name}</Text>
          <View style={styles.salaryRow}>
            <Text style={styles.salary}>{job.salary}€</Text>
            <Text style={styles.salaryLabel}>/ mes líquido</Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={COLORS.secondary} />
            <Text style={styles.detailLabel}>Localización</Text>
            <Text style={styles.detailValue}>{job.location_type}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.detailLabel}>Hora inicio</Text>
            <Text style={styles.detailValue}>{job.start_time}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color={COLORS.secondary} />
            <Text style={styles.detailLabel}>Radio</Text>
            <Text style={styles.detailValue}>{job.radius} km</Text>
          </View>
          {job.description ? (
            <View style={styles.descriptionBox}>
              <Text style={styles.descTitle}>Descripción</Text>
              <Text style={styles.descText}>{job.description}</Text>
            </View>
          ) : null}
        </View>

        {user?.role === 'driver' && (
          <TouchableOpacity
            testID="apply-btn"
            style={[styles.applyBtn, applied && styles.appliedBtn]}
            onPress={handleApply}
            disabled={applying || applied}
          >
            {applying ? <ActivityIndicator color={COLORS.white} /> :
              <Text style={styles.applyBtnText}>{applied ? 'Ya has aplicado ✓' : 'Aplicar a la oferta'}</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error },
  scroll: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.md, height: 44 },
  backText: { ...TYPOGRAPHY.bodyMd, color: COLORS.primary },
  headerCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md },
  jobType: { ...TYPOGRAPHY.h3, color: COLORS.white, textTransform: 'capitalize' },
  companyName: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary, marginTop: 4 },
  salaryRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: SPACING.md },
  salary: { ...TYPOGRAPHY.h2, color: COLORS.secondary },
  salaryLabel: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary, marginLeft: SPACING.xs },
  detailsCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOWS.sm },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.subtle },
  detailLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary, marginLeft: SPACING.sm, flex: 1 },
  detailValue: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  descriptionBox: { marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.subtle },
  descTitle: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary, marginBottom: SPACING.xs },
  descText: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary, lineHeight: 24 },
  applyBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.md },
  appliedBtn: { backgroundColor: COLORS.success },
  applyBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
});
