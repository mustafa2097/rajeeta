import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  ErrorBanner,
  GlassCard,
  Header,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { colors, dayNames, formatIqd, radius, rtlText, spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import type { Doctor } from '@/types';

export default function DoctorDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setDoctor(await api.fetchDoctor(id));
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'تعذر تحميل بيانات الطبيب');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Screen>
      <Header title="تفاصيل الطبيب" back />
      {loading ? <LoadingState /> : null}
      <ErrorBanner message={error} />
      {doctor ? (
        <>
          <GlassCard style={styles.profile}>
            <View style={styles.avatar}>
              <Ionicons name="medical" size={38} color={colors.primary} />
            </View>
            <Text style={styles.name}>د. {doctor.fullName}</Text>
            <Text style={styles.specialty}>{doctor.specialty}</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>★ {doctor.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>التقييم</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatIqd(doctor.consultationFee)}</Text>
                <Text style={styles.statLabel}>الكشفية</Text>
              </View>
            </View>
          </GlassCard>

          <SectionTitle title="معلومات العيادة" />
          <GlassCard style={styles.details}>
            <Text style={styles.detail}>🏥 {doctor.clinicName || 'اسم العيادة غير محدد'}</Text>
            <Text style={styles.detail}>📍 {doctor.clinicAddress || 'العنوان غير محدد'}</Text>
            {doctor.clinicFloor ? <Text style={styles.detail}>🏢 الطابق {doctor.clinicFloor}</Text> : null}
          </GlassCard>

          <SectionTitle title="أوقات الدوام" />
          <GlassCard style={styles.details}>
            {doctor.availabilitySlots?.length ? (
              doctor.availabilitySlots
                .filter((slot) => slot.isAvailable)
                .map((slot) => (
                  <View key={slot.id} style={styles.slot}>
                    <Text style={styles.time}>{slot.startTime} – {slot.endTime}</Text>
                    <Text style={styles.day}>{dayNames[slot.dayOfWeek] ?? 'يوم'}</Text>
                  </View>
                ))
            ) : (
              <Text style={styles.detail}>تظهر الأوقات المتوفرة عند بدء الحجز.</Text>
            )}
          </GlassCard>
          <PrimaryButton
            title="احجز موعداً"
            icon="calendar-outline"
            onPress={() =>
              router.push({ pathname: '/book/[doctorId]', params: { doctorId: doctor.id } })
            }
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.ink, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  specialty: { color: colors.primaryMid, fontSize: 16 },
  stats: { flexDirection: 'row-reverse', gap: spacing.md, width: '100%', marginTop: spacing.sm },
  stat: { flex: 1, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  statValue: { color: colors.ink, fontWeight: '800' },
  statLabel: { color: colors.inkSoft, fontSize: 12, marginTop: 3 },
  details: { gap: spacing.md },
  detail: { color: colors.ink, lineHeight: 22, ...rtlText },
  slot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  time: { color: colors.primaryMid, fontWeight: '700' },
  day: { color: colors.ink, fontWeight: '700' },
});
