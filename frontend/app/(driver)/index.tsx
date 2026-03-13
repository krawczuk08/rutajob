import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import * as Location from 'expo-location';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const JOB_TYPE_ICONS: Record<string, string> = {
  'frigorífico': 'snowflake', 'lona': 'tent', 'bañera': 'dump-truck',
  'grúa móvil': 'crane', 'prancha': 'truck-flatbed', 'góndola': 'truck-trailer',
};

export default function DriverDashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          // Update driver location in backend
          await fetch(`${API_URL}/api/drivers/location`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
          });
        }
      } catch (e) { console.log('Location error:', e); }
    })();
  }, []);

  const fetchJobs = async () => {
    try {
      let url = `${API_URL}/api/jobs/all`;
      if (location) {
        url = `${API_URL}/api/jobs/nearby?lat=${location.latitude}&lon=${location.longitude}`;
      }
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setJobs(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { fetchJobs(); }, [token, location]));

  const renderJob = ({ item }: { item: any }) => (
    <TouchableOpacity testID={`job-item-${item.job_id}`} style={styles.jobCard}
      onPress={() => router.push(`/job/${item.job_id}`)} activeOpacity={0.85}>
      <View style={styles.jobHeader}>
        <View style={[styles.jobTypeIcon, { backgroundColor: COLORS.secondaryLight + '20' }]}>
          <MaterialCommunityIcons name={(JOB_TYPE_ICONS[item.job_type] || 'truck') as any} size={24} color={COLORS.secondary} />
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobType}>{item.job_type}</Text>
          <Text style={styles.companyName}>{item.company_name}</Text>
        </View>
        <View style={styles.salaryBadge}>
          <Text style={styles.salaryText}>{item.salary}€</Text>
        </View>
      </View>
      <View style={styles.jobMeta}>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{item.location_type}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textTertiary} />
            <Text style={styles.metaText}>{item.start_time}</Text>
          </View>
          {item.distance_km !== undefined && (
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="map-marker-distance" size={14} color={COLORS.info} />
              <Text style={[styles.metaText, { color: COLORS.info }]}>{item.distance_km} km</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hola, {user?.name || 'Conductor'}</Text>
          <Text style={styles.headerSubtitle}>
            {location ? 'Ofertas cerca de ti' : 'Todas las ofertas disponibles'}
          </Text>
        </View>
        {location && (
          <View style={styles.locationBadge}>
            <MaterialCommunityIcons name="crosshairs-gps" size={16} color={COLORS.success} />
            <Text style={styles.locationText}>GPS</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="briefcase-search-outline" size={64} color={COLORS.textDisabled} />
          <Text style={styles.emptyTitle}>Sin ofertas disponibles</Text>
          <Text style={styles.emptyDesc}>No hay vacantes cerca de tu ubicación. Intenta más tarde.</Text>
        </View>
      ) : (
        <FlatList data={jobs} renderItem={renderJob} keyExtractor={item => item.job_id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchJobs(); }} tintColor={COLORS.secondary} />}
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
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '20', paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  locationText: { ...TYPOGRAPHY.caption, color: COLORS.success },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.md, paddingBottom: SPACING.xl },
  jobCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.md },
  jobHeader: { flexDirection: 'row', alignItems: 'center' },
  jobTypeIcon: { width: 48, height: 48, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center' },
  jobInfo: { flex: 1, marginLeft: SPACING.md },
  jobType: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  companyName: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary, marginTop: 2 },
  salaryBadge: { backgroundColor: COLORS.success + '15', paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  salaryText: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.success },
  jobMeta: { marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.subtle },
  metaRow: { flexDirection: 'row', gap: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl },
  emptyTitle: { ...TYPOGRAPHY.h4, color: COLORS.textSecondary, marginTop: SPACING.md },
  emptyDesc: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary, marginTop: SPACING.xs, textAlign: 'center' },
});
