export const COLORS = {
  primary: '#1B2A4A',
  primaryLight: '#2C3E63',
  primaryDark: '#0F1A33',
  secondary: '#FF6B35',
  secondaryLight: '#FF8A60',
  secondaryDark: '#D94D1A',
  background: '#F4F6F8',
  paper: '#FFFFFF',
  subtle: '#E2E8F0',
  textPrimary: '#1B2A4A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textDisabled: '#CBD5E1',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  border: '#CBD5E1',
  white: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  containerPadding: 20,
};

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 6,
  },
};

export const TYPOGRAPHY = {
  h1: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  h2: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
  h3: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  h4: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  bodyLg: { fontSize: 18, lineHeight: 28, fontWeight: '400' as const },
  bodyMd: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
};
