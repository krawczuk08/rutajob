import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function CompanySettings() {
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [compRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/companies/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/subscriptions/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (compRes.ok) setCompany(await compRes.json());
      if (subRes.ok) setSubscription(await subRes.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const handleCancelSub = async () => {
    try {
      await fetch(`${API_URL}/api/subscriptions/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Ajustes</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos de Empresa</Text>
          {company && (
            <>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Empresa</Text><Text style={styles.infoValue}>{company.company_name}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>CIF/NIF</Text><Text style={styles.infoValue}>{company.cif_nif}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Ciudad</Text><Text style={styles.infoValue}>{company.city}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Contacto</Text><Text style={styles.infoValue}>{company.contact_person}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>IBAN</Text><Text style={styles.infoValue}>****{company.iban?.slice(-4)}</Text></View>
            </>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Suscripción</Text>
          {subscription && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Estado</Text>
                <View style={[styles.statusBadge, { backgroundColor: subscription.status === 'active' ? COLORS.success + '20' : COLORS.error + '20' }]}>
                  <Text style={[styles.statusText, { color: subscription.status === 'active' ? COLORS.success : COLORS.error }]}>
                    {subscription.status === 'active' ? 'Activa' : 'Cancelada'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Importe</Text><Text style={styles.infoValue}>{subscription.amount}€ / 30 días</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Próximo pago</Text><Text style={styles.infoValue}>{new Date(subscription.next_payment_date).toLocaleDateString('es-ES')}</Text></View>
              {subscription.status === 'active' && (
                <TouchableOpacity testID="cancel-sub-btn" style={styles.dangerBtn} onPress={handleCancelSub}>
                  <Text style={styles.dangerBtnText}>Cancelar Suscripción</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

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
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardTitle: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.primary, marginBottom: SPACING.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.subtle },
  infoLabel: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
  infoValue: { ...TYPOGRAPHY.bodySm, fontWeight: '600', color: COLORS.primary },
  statusBadge: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full },
  statusText: { ...TYPOGRAPHY.caption, fontWeight: '600' },
  dangerBtn: { marginTop: SPACING.md, borderWidth: 1.5, borderColor: COLORS.error, borderRadius: RADIUS.md, height: 48, justifyContent: 'center', alignItems: 'center' },
  dangerBtnText: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.error },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.xl, height: 48 },
  logoutText: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.error },
});
