import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppInput,
  DoctorCard,
  EmptyState,
  ErrorBanner,
  GlassCard,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { colors, radius, rtlText, spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import type { AiSuggestion } from '@/types';

export default function AiScreen() {
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState('');
  const [result, setResult] = useState<AiSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (diagnosis.trim().length < 3) return;
    setLoading(true);
    setError('');
    try {
      setResult(await api.suggestDoctors(diagnosis.trim()));
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر الحصول على اقتراحات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryMid, colors.primaryLight]}
        style={styles.hero}>
        <Text style={styles.heroIcon}>✦</Text>
        <View style={styles.flex}>
          <Text style={styles.heroTitle}>المساعد الذكي</Text>
          <Text style={styles.heroBody}>
            اكتب أعراضك أو تشخيصك لنقترح التخصص والأطباء الأنسب.
          </Text>
        </View>
      </LinearGradient>
      <GlassCard style={styles.form}>
        <AppInput
          label="التشخيص أو الأعراض"
          placeholder="مثال: ألم في الصدر، طفح جلدي..."
          value={diagnosis}
          onChangeText={setDiagnosis}
          multiline
        />
        <PrimaryButton
          title={loading ? 'جارٍ التحليل...' : 'اقترح أطباء'}
          icon="sparkles"
          onPress={submit}
          loading={loading}
          disabled={diagnosis.trim().length < 3}
        />
      </GlassCard>
      <ErrorBanner message={error} />
      {result?.suggestedSpecialty ? (
        <GlassCard style={styles.result}>
          <Text style={styles.specialty}>التخصص المقترح: {result.suggestedSpecialty}</Text>
          <Text style={styles.explanation}>
            {result.explanation ?? 'هذا التخصص هو الأقرب إلى الأعراض المدخلة.'}
          </Text>
          {result.noExactMatch ? (
            <Text style={styles.warning}>هذه أقرب النتائج المتوفرة حالياً.</Text>
          ) : null}
        </GlassCard>
      ) : null}
      {result ? <SectionTitle title="الأطباء المقترحون" /> : null}
      {result && !result.doctors.length ? (
        <EmptyState
          icon="search-outline"
          title="لا توجد نتائج"
          body="جرّب وصف الأعراض بطريقة أخرى أو اختر تخصصاً من الصفحة الرئيسية."
        />
      ) : null}
      {result?.doctors.map((doctor) => (
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
  hero: { borderRadius: radius.lg, minHeight: 138, padding: spacing.lg, flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  heroIcon: { color: colors.white, fontSize: 42 },
  flex: { flex: 1, gap: spacing.sm },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '900', ...rtlText },
  heroBody: { color: '#E3FCFF', lineHeight: 22, ...rtlText },
  form: { gap: spacing.md },
  result: { gap: spacing.sm, backgroundColor: 'rgba(220,252,231,0.88)' },
  specialty: { color: colors.ink, fontSize: 17, fontWeight: '800', ...rtlText },
  explanation: { color: colors.inkSoft, lineHeight: 22, ...rtlText },
  warning: { color: colors.warning, fontWeight: '700', ...rtlText },
});
