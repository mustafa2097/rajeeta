export const colors = {
  primary: '#0891B2',
  primaryDark: '#0B2A38',
  primaryMid: '#006994',
  primaryLight: '#22D3EE',
  primarySoft: '#E6F4F9',
  accent: '#16A34A',
  accentSoft: '#DCFCE7',
  background: '#F0FDFA',
  surface: '#FFFFFF',
  ink: '#134E4A',
  inkSoft: '#5A7A8A',
  border: '#CCFBF1',
  danger: '#DC2626',
  warning: '#D97706',
  success: '#059669',
  white: '#FFFFFF',
  overlay: 'rgba(11, 42, 56, 0.45)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const shadow = {
  shadowColor: '#006994',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 4,
} as const;

export const rtlText = {
  textAlign: 'right' as const,
  writingDirection: 'rtl' as const,
};

export const dayNames = [
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
] as const;

export const formatIqd = (value: number) =>
  `${new Intl.NumberFormat('ar-IQ').format(value)} د.ع`;

export const statusLabel = (status: string) =>
  (
    {
      PENDING: 'قيد الانتظار',
      CONFIRMED: 'مؤكد',
      REJECTED: 'مرفوض',
      COMPLETED: 'مكتمل',
      CANCELLED: 'ملغى',
    } as Record<string, string>
  )[status] ?? status;
