import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AiSlopeCard,
  DoctorCard,
  ErrorBanner,
  GlassCard,
  Header,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { colors, radius, rtlText, spacing, statusLabel } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { useData } from '@/context/data';

const specialties = [
  ['باطنية', 'fitness-outline'],
  ['قلب', 'heart-outline'],
  ['أطفال', 'happy-outline'],
  ['جلدية', 'sparkles-outline'],
  ['عيون', 'eye-outline'],
  ['أسنان', 'medical-outline'],
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    doctors,
    appointments,
    loadingDoctors,
    error,
    refreshDoctors,
    refreshAppointments,
  } = useData();
  const upcoming = [...appointments]
    .filter((item) => new Date(item.scheduledAt) >= new Date() && item.status !== 'CANCELLED')
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0];

  const refresh = async () => {
    await Promise.all([refreshDoctors(true), refreshAppointments()]);
  };

  return (
    <Screen refreshing={loadingDoctors} onRefresh={refresh}>
      <Header
        title={`مرحباً، ${user?.patientProfile?.fullName?.split(' ')[0] ?? 'بك'}`}
        subtitle="كيف يمكننا مساعدتك اليوم؟"
        action={
          <Pressable
            onPress={() => router.push('/notifications')}
            style={styles.notification}
            accessibilityRole="button"
            accessibilityLabel="الإشعارات">
            <Ionicons name="notifications-outline" size={22} color={colors.ink} />
          </Pressable>
        }
      />
      <ErrorBanner message={error} />
      <AiSlopeCard
        title="مساعد راجيتة الذكي"
        body="اكتب الأعراض التي تشعر بها وسنساعدك في الوصول إلى التخصص الأنسب."
        onPress={() => router.push('/(tabs)/ai')}
      />

      {upcoming ? (
        <>
          <SectionTitle title="موعدك القادم" />
          <GlassCard style={styles.appointment}>
            <View style={styles.calendarBadge}>
              <Text style={styles.day}>{new Date(upcoming.scheduledAt).getDate()}</Text>
              <Text style={styles.month}>
                {new Date(upcoming.scheduledAt).toLocaleDateString('ar-IQ', { month: 'short' })}
              </Text>
            </View>
            <View style={styles.appointmentInfo}>
              <Text style={styles.appointmentDoctor}>
                د. {upcoming.doctor?.fullName ?? 'الطبيب'}
              </Text>
              <Text style={styles.appointmentMeta}>
                {new Date(upcoming.scheduledAt).toLocaleTimeString('ar-IQ', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                • {statusLabel(upcoming.status)}
              </Text>
            </View>
          </GlassCard>
        </>
      ) : null}

      <SectionTitle title="اختر التخصص" />
      <View style={styles.specialties}>
        {specialties.map(([name, icon]) => (
          <Pressable
            key={name}
            onPress={() =>
              router.push({ pathname: '/doctors/specialty', params: { name } })
            }
            style={styles.specialty}>
            <View style={styles.specialtyIcon}>
              <Ionicons name={icon} size={25} color={colors.primary} />
            </View>
            <Text style={styles.specialtyText}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle
        title="أطباء مقترحون"
        action={
          <Pressable
            onPress={() =>
              router.push({ pathname: '/doctors/specialty', params: { name: '' } })
            }>
            <Text style={styles.all}>عرض الكل</Text>
          </Pressable>
        }
      />
      {doctors.slice(0, 4).map((doctor) => (
        <DoctorCard
          key={doctor.id}
          doctor={doctor}
          onPress={() =>
            router.push({ pathname: '/doctors/[id]', params: { id: doctor.id } })
          }
        />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  notification: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  appointment: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  calendarBadge: { width: 60, height: 64, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  day: { color: colors.primaryMid, fontSize: 24, fontWeight: '900' },
  month: { color: colors.primaryMid, fontSize: 11 },
  appointmentInfo: { flex: 1, gap: spacing.xs },
  appointmentDoctor: { color: colors.ink, fontSize: 17, fontWeight: '800', ...rtlText },
  appointmentMeta: { color: colors.inkSoft, ...rtlText },
  specialties: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  specialty: { width: '31%', minHeight: 102, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  specialtyIcon: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  specialtyText: { color: colors.ink, fontWeight: '700' },
  all: { color: colors.primary, fontWeight: '700' },
});
