import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const DOC_TYPES = [
  { key: 'licencia', label: 'Carta de Conducción', icon: 'card-account-details' },
  { key: 'cap', label: 'CAP', icon: 'certificate' },
  { key: 'tacografo', label: 'Tarjeta de Tacógrafo', icon: 'card-text' },
  { key: 'dni_tie', label: 'DNI / TIE', icon: 'badge-account-horizontal' },
];

export default function DriverProfile() {
  const { user, token } = useAuth();
  const [driver, setDriver] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [analyzing, setAnalyzing] = useState('');

  const fetchData = async () => {
    try {
      const driverRes = await fetch(`${API_URL}/api/drivers/me`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (driverRes.ok) {
        const d = await driverRes.json();
        setDriver(d);
        const docsRes = await fetch(`${API_URL}/api/documents/driver/${d.driver_id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (docsRes.ok) setDocs(await docsRes.json());
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const uploadDocument = async (docType: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
      if (result.canceled || !result.assets[0].base64) return;
      setUploading(docType);
      const res = await fetch(`${API_URL}/api/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          driver_id: driver.driver_id,
          doc_type: docType,
          data_base64: result.assets[0].base64,
          filename: result.assets[0].fileName || `${docType}.jpg`,
        }),
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
    finally { setUploading(''); }
  };

  const analyzeDocument = async (documentId: string) => {
    setAnalyzing(documentId);
    try {
      const res = await fetch(`${API_URL}/api/documents/analyze/${documentId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        fetchData();
      }
    } catch (e) { console.error(e); }
    finally { setAnalyzing(''); }
  };

  const getDocForType = (type: string) => docs.find(d => d.doc_type === type);

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={COLORS.secondary} /></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Mi Perfil</Text>

        {driver && (
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={40} color={COLORS.white} />
            </View>
            <Text style={styles.profileName}>{driver.first_name} {driver.last_name}</Text>
            <Text style={styles.profileInfo}>{driver.city}, {driver.country}</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{driver.experience_years}</Text>
                <Text style={styles.statLabel}>Experiencia</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{driver.truck_types?.length || 0}</Text>
                <Text style={styles.statLabel}>Tipos camión</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statValue}>{driver.accepts_loading ? 'Sí' : 'No'}</Text>
                <Text style={styles.statLabel}>Carga/Descarga</Text>
              </View>
            </View>
            <View style={styles.truckTypesRow}>
              {driver.truck_types?.map((t: string) => (
                <View key={t} style={styles.truckBadge}><Text style={styles.truckBadgeText}>{t}</Text></View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Documentos Obligatorios</Text>
        {DOC_TYPES.map(dt => {
          const doc = getDocForType(dt.key);
          return (
            <View key={dt.key} style={styles.docCard}>
              <View style={styles.docHeader}>
                <MaterialCommunityIcons name={dt.icon as any} size={24} color={doc ? COLORS.success : COLORS.textTertiary} />
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{dt.label}</Text>
                  <Text style={[styles.docStatus, { color: doc ? COLORS.success : COLORS.warning }]}>
                    {doc ? (doc.verified ? 'Verificado ✓' : 'Subido') : 'Pendiente'}
                  </Text>
                </View>
                {!doc ? (
                  <TouchableOpacity testID={`upload-${dt.key}-btn`} style={styles.uploadBtn}
                    onPress={() => uploadDocument(dt.key)} disabled={uploading === dt.key}>
                    {uploading === dt.key ? <ActivityIndicator size="small" color={COLORS.white} /> :
                      <Text style={styles.uploadBtnText}>Subir</Text>}
                  </TouchableOpacity>
                ) : !doc.verified ? (
                  <TouchableOpacity testID={`analyze-${dt.key}-btn`} style={styles.analyzeBtn}
                    onPress={() => analyzeDocument(doc.document_id)} disabled={analyzing === doc.document_id}>
                    {analyzing === doc.document_id ? <ActivityIndicator size="small" color={COLORS.secondary} /> :
                      <Text style={styles.analyzeBtnText}>Analizar</Text>}
                  </TouchableOpacity>
                ) : null}
              </View>
              {doc?.analysis_result ? (
                <View style={styles.analysisBox}>
                  <Text style={styles.analysisTitle}>Análisis IA</Text>
                  <Text style={styles.analysisText} numberOfLines={4}>{doc.analysis_result}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { paddingHorizontal: SPACING.containerPadding, paddingTop: SPACING.lg, paddingBottom: SPACING.xl },
  title: { ...TYPOGRAPHY.h3, color: COLORS.primary, marginBottom: SPACING.lg },
  profileCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', marginBottom: SPACING.lg },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  profileName: { ...TYPOGRAPHY.h4, color: COLORS.white },
  profileInfo: { ...TYPOGRAPHY.bodySm, color: COLORS.textTertiary, marginTop: 4 },
  statsRow: { flexDirection: 'row', marginTop: SPACING.lg, width: '100%' },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { ...TYPOGRAPHY.bodyMd, fontWeight: '700', color: COLORS.secondary },
  statLabel: { ...TYPOGRAPHY.caption, color: COLORS.textTertiary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: COLORS.primaryLight, marginVertical: 4 },
  truckTypesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginTop: SPACING.md },
  truckBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: SPACING.sm, paddingVertical: 4, borderRadius: RADIUS.full },
  truckBadgeText: { ...TYPOGRAPHY.caption, color: COLORS.white },
  sectionTitle: { ...TYPOGRAPHY.h4, color: COLORS.primary, marginBottom: SPACING.md },
  docCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: SPACING.md },
  docLabel: { ...TYPOGRAPHY.bodyMd, fontWeight: '600', color: COLORS.primary },
  docStatus: { ...TYPOGRAPHY.caption, marginTop: 2 },
  uploadBtn: { backgroundColor: COLORS.secondary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  uploadBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.white },
  analyzeBtn: { borderWidth: 1.5, borderColor: COLORS.secondary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md },
  analyzeBtnText: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.secondary },
  analysisBox: { marginTop: SPACING.sm, padding: SPACING.sm, backgroundColor: COLORS.info + '10', borderRadius: RADIUS.md },
  analysisTitle: { ...TYPOGRAPHY.caption, fontWeight: '700', color: COLORS.info, marginBottom: 4 },
  analysisText: { ...TYPOGRAPHY.bodySm, color: COLORS.textSecondary },
});
