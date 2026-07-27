import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EmptyState,
  ErrorBanner,
  GlassCard,
  Header,
  LoadingState,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { colors, formatIqd, radius, rtlText, spacing, statusLabel } from '@/constants/theme';
import { useData } from '@/context/data';
import { api, ApiError } from '@/lib/api';

const filters = [
  ['ALL', 'الكل'],
  ['UPCOMING', 'القادمة'],
  ['PAST', 'السابقة'],
] as const;

export default function AppointmentsScreen() {
  const {
    appointments,
    loadingAppointments,
    error,
    refreshAppointments,
  } = useData();
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('ALL');
  const [paying, setPaying] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const visible = appointments
    .filter((item) => {
      if (filter === 'UPCOMING') return +new Date(item.scheduledAt) >= now;
      if (filter === 'PAST') return +new Date(item.scheduledAt) < now;
      return true;
    })
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt));

  const pay = async (id: string) => {
    setPaying(id);
    try {
      await api.payConsultation(id);
      await refreshAppointments();
      Alert.alert('تم الدفع', 'تم تسجيل دفعة الاستشارة بنجاح.');
    } catch (cause) {
      Alert.alert('تعذر الدفع', cause instanceof ApiError ? cause.message : 'حاول مجدداً');
    } finally {
      setPaying(null);
    }
  };

  return (
    <Screen refreshing={loadingAppointments} onRefresh={refreshAppointments}>
      <Header title="مواعيدي" subtitle="تابع حجوزاتك وحالة كل موعد" />
      <View style={styles.filters}>
        {filters.map(([value, label]) => (
          <Pressable
            key={value}
            onPress={() => setFilter(value)}
            style={[styles.filter, filter === value && styles.filterActive]}>
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
      <ErrorBanner message={error} />
      {loadingAppointments && !appointments.length ? <LoadingState /> : null}
      {!loadingAppointments && !visible.length ? (
        <EmptyState
          icon="calendar-outline"
          title="لا توجد مواعيد"
          body="عندما تحجز موعداً سيظهر هنا مع تفاصيل الطبيب والوقت."
        />
      ) : null}
      {visible.map((appointment) => (
        <GlassCard key={appointment.id} style={styles.card}>
          <View style={styles.topRow}>
            <View style={[styles.status, statusStyle(appointment.status)]}>
              <Text style={styles.statusText}>{statusLabel(appointment.status)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.doctor}>د. {appointment.doctor?.fullName ?? 'الطبيب'}</Text>
              <Text style={styles.specialty}>{appointment.doctor?.specialty}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.detail}>
            📅 {new Date(appointment.scheduledAt).toLocaleDateString('ar-IQ', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Text style={styles.detail}>
            🕐 {new Date(appointment.scheduledAt).toLocaleTimeString('ar-IQ', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.detail}>
            💳 {formatIqd(appointment.amountPaid || appointment.consultationFee)} •{' '}
            {appointment.paymentMethod === 'ELECTRONIC' ? 'إلكتروني' : 'نقدي'}
          </Text>
          {appointment.rejectionMessage ? (
            <Text style={styles.rejection}>{appointment.rejectionMessage}</Text>
          ) : null}
          {appointment.consultationPaymentStatus === 'PENDING' ? (
            <PrimaryButton
              title="دفع الاستشارة"
              onPress={() => pay(appointment.id)}
              loading={paying === appointment.id}
            />
          ) : null}
        </GlassCard>
      ))}
    </Screen>
  );
}

const statusStyle = (status: string) => ({
  backgroundColor:
    status === 'CONFIRMED'
      ? colors.accentSoft
      : status === 'REJECTED'
        ? '#FEE2E2'
        : colors.primarySoft,
});

const styles = StyleSheet.create({
  filters: { flexDirection: 'row-reverse', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.pill, padding: spacing.xs },
  filter: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  filterActive: { backgroundColor: colors.primary },
  filterText: { color: colors.inkSoft, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  card: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: 2 },
  doctor: { color: colors.ink, fontSize: 17, fontWeight: '800', ...rtlText },
  specialty: { color: colors.primaryMid, ...rtlText },
  status: { paddingVertical: 7, paddingHorizontal: 11, borderRadius: radius.pill },
  statusText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  detail: { color: colors.inkSoft, lineHeight: 23, ...rtlText },
  rejection: { color: colors.danger, backgroundColor: '#FEE2E2', padding: spacing.sm, borderRadius: radius.sm, ...rtlText },
});
