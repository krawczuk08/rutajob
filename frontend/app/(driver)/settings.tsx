import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DriverSettings() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [drvRes, appRes] = await Promise.all([
        fetch(`${API_URL}/api/drivers/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/applications/driver`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (drvRes.ok) setDriver(await drvRes.json());
      if (appRes.ok) setApplications(await appRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const handleLogout = async () => { await logout(); router.replace('/'); };

  const statusColors: Record<string, string> = { pending: COLORS.warning, hired: COLORS.success, rejected: COLORS.error };
  const statusLabels: Record<string, string> = { pending: 'Pendiente', hired: 'Contratado', rejected: 'Rechazado' };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Ajustes</Text>

        {driver?.is_blocked && (
          <View style={styles.blockedBox}>
            <MaterialCommunityIcons name="alert-octagon" size={24} color={COLORS.error} />
            <Text style={styles.blockedText}>Tu cuenta está bloqueada por evaluaciones negativas</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Mis Aplicaciones</Text>
        {applications.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No has aplicado a ninguna vacante aún</Text>
          </View>
        ) : (
          applications.map(app => (
            <View key={app.application_id} style={styles.appCard}>
              <View style={styles.appHeader}>
                <Text style={styles.appJobType}>{app.job?.job_type || 'Vacante'}</Text>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[app.status] || COLORS.warning) + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[app.status] || COLORS.warning }]}>
                    {statusLabels[app.status] || app.status}
                  </Text>
                </View>
              </View>
              {app.job && (
                <View style={styles.appMeta}>
                  <Text style={styles.appMetaText}>{app.job.company_name} · {app.job.salary}€ · {app.job.location_type}</Text>
                </View>
              )}
            </View>
          ))
        )}

        <TouchableOpacity testID="logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={20} color={COLORS.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  title: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginBottom: SPACING.lg },
  blockedBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.error + '15', padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.lg },
  blockedText: { ...TYPOGRAPHY.bodyMd, color: COLORS.error, flex: 1 },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.primary, marginBottom: SPACING.md },
  emptyBox: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center' },
  emptyText: { ...TYPOGRAPHY.bodyMd, color: COLORS.textTertiary },
  appCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  appJobType: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  appMeta: { marginTop: SPACING.xs },
  appMetaText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, height: 48 },
  logoutText: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.error },
});
