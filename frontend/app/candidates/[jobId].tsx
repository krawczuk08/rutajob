import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CandidatesScreen() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const { token } = useAuth();
  const [candidates, setCandidates] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hiring, setHiring] = useState('');

  useEffect(() => { fetchData(); }, [jobId]);

  const fetchData = async () => {
    try {
      const [jobRes, appRes] = await Promise.all([
        fetch(`${API_URL}/api/jobs/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/applications/job/${jobId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (jobRes.ok) setJob(await jobRes.json());
      if (appRes.ok) setCandidates(await appRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleHire = async (applicationId: string) => {
    setHiring(applicationId);
    try {
      await fetch(`${API_URL}/api/applications/${applicationId}/hire`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchData();
    } catch (e) { console.error(e); }
    finally { setHiring(''); }
  };

  const renderCandidate = ({ item }: { item: any }) => (
    <View style={styles.candidateCard}>
      <TouchableOpacity testID={`view-driver-${item.driver_id}`}
        style={styles.candidateHeader}
        onPress={() => router.push(`/driver-view/${item.driver_id}`)}>
        <View style={styles.avatar}>
          <MaterialCommunityIcons name="account" size={28} color={COLORS.white} />
        </View>
        <View style={styles.candidateInfo}>
          <Text style={styles.candidateName}>{item.driver_name}</Text>
          {item.driver && (
            <View style={styles.candidateMeta}>
              <Text style={styles.metaText}>{item.driver.experience_years}</Text>
              {item.driver.avg_score > 0 && (
                <View style={styles.scoreBadge}>
                  <MaterialCommunityIcons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.scoreText}>{item.driver.avg_score}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'hired' ? COLORS.success + '20' : COLORS.warning + '20' }]}>
          <Text style={[styles.statusText, { color: item.status === 'hired' ? COLORS.success : COLORS.warning }]}>
            {item.status === 'hired' ? 'Contratado' : 'Pendiente'}
          </Text>
        </View>
      </TouchableOpacity>

      {item.status === 'pending' && (
        <View style={styles.actionRow}>
          <TouchableOpacity testID={`hire-${item.application_id}`}
            style={styles.hireBtn} onPress={() => handleHire(item.application_id)} disabled={hiring === item.application_id}>
            {hiring === item.application_id ? <ActivityIndicator size="small" color={COLORS.white} /> :
              <Text style={styles.hireBtnText}>Contratar</Text>}
          </TouchableOpacity>
          <TouchableOpacity testID={`evaluate-${item.driver_id}`}
            style={styles.evalBtn}
            onPress={() => router.push(`/evaluate/${item.driver_id}`)}>
            <Text style={styles.evalBtnText}>Evaluar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        <Text style={styles.backText}>Volver</Text>
      </TouchableOpacity>

      {job && (
        <View style={styles.jobBanner}>
          <Text style={styles.jobType}>{job.job_type} - {job.location_type}</Text>
          <Text style={styles.jobSalary}>{job.salary}€</Text>
        </View>
      )}

      <Text style={styles.title}>Candidatos ({candidates.length})</Text>

      {candidates.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="account-search-outline" size={64} color={COLORS.textDisabled} />
          <Text style={styles.emptyText}>Aún no hay candidatos para esta vacante</Text>
        </View>
      ) : (
        <FlatList data={candidates} renderItem={renderCandidate}
          keyExtractor={item => item.application_id}
          contentContainerStyle={styles.list} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: SPACING.containerPadding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, height: 44 },
  backText: { ...TYPOGRAPHY.bodyMd, color: COLORS.primary },
  jobBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.sm },
  jobType: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.white, textTransform: 'capitalize' },
  jobSalary: { ...TYPOGRAPHY.h4, color: COLORS.secondary },
  title: { ...TYPOGRAPHY.h4, color: COLORS.primary, marginTop: SPACING.md, marginBottom: SPACING.md },
  list: { paddingBottom: SPACING.xl },
  candidateCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  candidateHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  candidateInfo: { flex: 1, marginLeft: SPACING.md },
  candidateName: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary },
  candidateMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  metaText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
  scoreBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  scoreText: { ...TYPOGRAPHY.caption, fontWeight: '600', color: COLORS.warning },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.subtle },
  hireBtn: { flex: 1, backgroundColor: COLORS.success, borderRadius: RADIUS.md, height: 44, justifyContent: 'center', alignItems: 'center' },
  hireBtnText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.white },
  evalBtn: { flex: 1, borderWidth: 1.5, borderColor: COLORS.secondary, borderRadius: RADIUS.md, height: 44, justifyContent: 'center', alignItems: 'center' },
  evalBtnText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.secondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary, marginTop: SPACING.md, textAlign: 'center' },
});
