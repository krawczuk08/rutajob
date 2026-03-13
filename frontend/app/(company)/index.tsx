import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const JOB_TYPE_ICONS: Record<string, string> = {
  'frigorífico': 'snowflake', 'lona': 'tent', 'bañera': 'dump-truck',
  'grúa móvil': 'crane', 'prancha': 'truck-flatbed', 'góndola': 'truck-trailer',
};

export default function CompanyDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/api/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (e) {
      console.error('Error fetching jobs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchJobs(); }, [token]));

  const onRefresh = () => { setRefreshing(true); fetchJobs(); };

  const renderJob = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`job-card-${item.job_id}`}
      style={styles.jobCard}
      onPress={() => router.push(`/candidates/${item.job_id}`)}
      activeOpacity={0.85}
    >
      <View style={styles.jobHeader}>
        <View style={[styles.jobTypeIcon, { backgroundColor: COLORS.secondaryLight + '20' }]}>
          <MaterialCommunityIcons name={(JOB_TYPE_ICONS[item.job_type] || 'truck') as any} size={24} color={COLORS.secondary} />
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobType}>{item.job_type}</Text>
          <Text style={styles.jobLocation}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textSecondary} /> {item.location_type}
          </Text>
        </View>
        <View style={styles.salaryBadge}>
          <Text style={styles.salaryText}>{item.salary}€</Text>
        </View>
      </View>
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}>
          <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.textTertiary} />
          <Text style={styles.metaText}>{item.start_time}</Text>
        </View>
        {item.description ? <Text style={styles.jobDesc} numberOfLines={1}>{item.description}</Text> : null}
      </View>
      <View style={styles.jobFooter}>
        <Text style={styles.viewCandidates}>Ver candidatos →</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name || 'Empresa'}</Text>
          <Text style={styles.headerSubtitle}>Tus vacantes publicadas</Text>
        </View>
        <TouchableOpacity testID="create-job-header-btn" style={styles.addBtn}
          onPress={() => router.push('/(company)/create-job')}>
          <MaterialCommunityIcons name="plus" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="briefcase-plus-outline" size={64} color={COLORS.textDisabled} />
          <Text style={styles.emptyTitle}>Sin vacantes</Text>
          <Text style={styles.emptyDesc}>Publica tu primera oferta de trabajo</Text>
          <TouchableOpacity testID="create-first-job-btn" style={styles.emptyBtn}
            onPress={() => router.push('/(company)/create-job')}>
            <Text style={styles.emptyBtnText}>Publicar Vacante</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJob}
          keyExtractor={item => item.job_id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.secondary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.md, backgroundColor: COLORS.primary, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  greeting: { ...TYPOGRAPHY.h3, color: COLORS.white },
  headerSubtitle: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary, marginTop: 2 },
  addBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  jobCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.md },
  jobHeader: { flexDirection: 'row', alignItems: 'center' },
  jobTypeIcon: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1, marginLeft: SPACING.md },
  jobType: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  jobLocation: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary, marginTop: 2 },
  salaryBadge: { backgroundColor: COLORS.success + '15', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  salaryText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.success },
  jobMeta: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.subtle },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  metaText: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary },
  jobDesc: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary, marginTop: SPACING.xs },
  jobFooter: { marginTop: SPACING.sm, alignItems: 'flex-end' },
  viewCandidates: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.secondary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { ...TYPOGRAPHY.h4, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyDesc: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary, marginTop: SPACING.xs, textAlign: 'center' },
  emptyBtn: { backgroundColor: COLORS.secondary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, marginTop: SPACING.lg },
  emptyBtnText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.white },
});
