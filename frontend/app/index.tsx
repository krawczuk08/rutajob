import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, RADIUS } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.role) {
      if (user.role === 'company') {
        router.replace('/(company)');
      } else if (user.role === 'driver') {
        router.replace('/(driver)');
      }
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="truck-fast" size={48} color={COLORS.secondary} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <MaterialCommunityIcons name="truck-fast-outline" size={40} color={COLORS.secondary} />
          <Text style={styles.logoText}>Ruta Job</Text>
        </View>
        <Text style={styles.subtitle}>Conectamos empresas de transporte con conductores profesionales</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          testID="enter-company-btn"
          style={styles.companyCard}
          onPress={() => router.push('/login?role=company')}
          activeOpacity={0.85}
        >
          <View style={styles.cardIcon}>
            <MaterialCommunityIcons name="domain" size={40} color={COLORS.white} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Entrar como Empresa</Text>
            <Text style={styles.cardDesc}>Publica vacantes y encuentra conductores cualificados</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.white} />
        </TouchableOpacity>

        <TouchableOpacity
          testID="enter-driver-btn"
          style={styles.driverCard}
          onPress={() => router.push('/login?role=driver')}
          activeOpacity={0.85}
        >
          <View style={styles.cardIconOutline}>
            <MaterialCommunityIcons name="steering" size={40} color={COLORS.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitleDark}>Entrar como Conductor</Text>
            <Text style={styles.cardDescDark}>Encuentra ofertas de trabajo cerca de ti</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.categories}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Camión C</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Camión CE</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Grúa Móvil</Text>
          </View>
        </View>
        <Text style={styles.footerText}>Suscripción empresa: 7,35€ / 30 días</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: SPACING.md,
    ...TYPOGRAPHY.bodyMd,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  logoText: {
    ...TYPOGRAPHY.h1,
    color: COLORS.white,
    marginLeft: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.bodyMd,
    color: COLORS.textTertiary,
    maxWidth: 280,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.containerPadding,
    paddingTop: SPACING.xl,
    gap: SPACING.md,
  },
  companyCard: {
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  driverCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.md,
  },
  cardIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconOutline: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardTitle: {
    ...TYPOGRAPHY.h4,
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    ...TYPOGRAPHY.bodySm,
    color: 'rgba(255,255,255,0.8)',
  },
  cardTitleDark: {
    ...TYPOGRAPHY.h4,
    color: COLORS.primary,
    marginBottom: SPACING.xs,
  },
  cardDescDark: {
    ...TYPOGRAPHY.bodySm,
    color: COLORS.textSecondary,
  },
  footer: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.lg,
    alignItems: 'center',
  },
  categories: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textTertiary,
  },
});
