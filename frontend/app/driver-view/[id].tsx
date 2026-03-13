import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DriverViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/drivers/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setDriver(await res.json());
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;
  if (!driver) return <SafeAreaView style={styles.container}><View style={styles.center}><Text>Conductor no encontrado</Text></View></SafeAreaView>;

  const avgScore = driver.evaluations?.length > 0
    ? (driver.evaluations.reduce((s: number, e: any) => s + e.average, 0) / driver.evaluations.length).toFixed(1)
    : 'N/A';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={48} color={COLORS.white} />
          </View>
          <Text style={styles.name}>{driver.first_name} {driver.last_name}</Text>
          <Text style={styles.location}>{driver.city}, {driver.country}</Text>
          {driver.is_blocked && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedText}>Cuenta Bloqueada</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{driver.experience_years}</Text>
            <Text style={styles.statLabel}>Experiencia</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{avgScore}</Text>
            <Text style={styles.statLabel}>Valoración</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{driver.evaluations?.length || 0}</Text>
            <Text style={styles.statLabel}>Evaluaciones</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipos de camión</Text>
          <View style={styles.chipRow}>
            {driver.truck_types?.map((t: string) => (
              <View key={t} style={styles.chip}><Text style={styles.chipText}>{t}</Text></View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Carga/Descarga</Text>
            <Text style={styles.detailValue}>{driver.accepts_loading ? 'Sí' : 'No'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Disponibilidad</Text>
            <Text style={styles.detailValue}>{driver.availability}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          {driver.documents?.length > 0 ? driver.documents.map((doc: any) => (
            <View key={doc.document_id} style={styles.docRow}>
              <MaterialCommunityIcons name={doc.verified ? 'check-circle' : 'clock-outline'} size={20}
                color={doc.verified ? COLORS.success : COLORS.warning} />
              <Text style={styles.docText}>{doc.doc_type}</Text>
              <Text style={[styles.docStatus, { color: doc.verified ? COLORS.success : COLORS.warning }]}>
                {doc.verified ? 'Verificado' : 'Pendiente'}
              </Text>
            </View>
          )) : <Text style={styles.emptyText}>Sin documentos subidos</Text>}
        </View>

        {driver.evaluations?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evaluaciones recientes</Text>
            {driver.evaluations.slice(0, 5).map((ev: any) => (
              <View key={ev.evaluation_id} style={styles.evalCard}>
                <Text style={styles.evalCompany}>{ev.company_name}</Text>
                <View style={styles.evalScores}>
                  <Text style={styles.evalScore}>Compromiso: {ev.commitment}</Text>
                  <Text style={styles.evalScore}>Responsabilidad: {ev.responsibility}</Text>
                  <Text style={styles.evalScore}>Documentos: {ev.document_accuracy}</Text>
                  <Text style={styles.evalScore}>Puntualidad: {ev.punctuality}</Text>
                </View>
                <Text style={[styles.evalAvg, { color: ev.average >= 5 ? COLORS.success : COLORS.error }]}>
                  Media: {ev.average}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity testID="evaluate-btn" style={styles.evalBtn}
          onPress={() => router.push(`/evaluate/${id}`)}>
          <Text style={styles.evalBtnText}>Evaluar Conductor</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, height: 44 },
  backText: { ...TYPOGRAPHY.bodyMd, color: COLORS.primary },
  profileCard: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, marginTop: SPACING.md },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  name: { ...TYPOGRAPHY.h3, color: COLORS.white, marginTop: SPACING.md },
  location: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary, marginTop: 4 },
  blockedBadge: { backgroundColor: COLORS.error, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, marginTop: SPACING.md },
  blockedText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', ...SHADOWS.sm },
  statValue: { ...TYPOGRAPHY.h4, color: COLORS.secondary },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 4 },
  section: { marginTop: SPACING.lg },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.primary, marginBottom: SPACING.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  chip: { backgroundColor: COLORS.secondary + '15', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  chipText: { ...TYPOGRAPHY.bodySm, color: COLORS.secondary, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.subtle },
  detailLabel: { ...TYPOGRAPHY.bodyMd, color: COLORS.textSecondary },
  detailValue: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.subtle },
  docText: { flex: 1, ...TYPOGRAPHY.bodyMd, color: COLORS.primary, textTransform: 'capitalize' },
  docStatus: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  emptyText: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary },
  evalCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.sm },
  evalCompany: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary },
  evalScores: { marginTop: SPACING.xs },
  evalScore: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary },
  evalAvg: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', marginTop: SPACING.xs },
  evalBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: SPACING.xl, ...SHADOWS.md },
  evalBtnText: { ...TYPOGRAPHY.bodyLg, fontWeight: '700', color: COLORS.white },
});
