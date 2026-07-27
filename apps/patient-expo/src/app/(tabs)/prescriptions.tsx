import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  EmptyState,
  ErrorBanner,
  GlassCard,
  Header,
  LoadingState,
  Screen,
} from '@/components/ui';
import { colors, radius, rtlText, spacing } from '@/constants/theme';
import { useData } from '@/context/data';
import { api } from '@/lib/api';

export default function PrescriptionsScreen() {
  const {
    prescriptions,
    loadingPrescriptions,
    error,
    refreshPrescriptions,
  } = useData();
  const [tab, setTab] = useState<'digital' | 'handwritten'>('digital');
  const list =
    tab === 'digital'
      ? prescriptions.prescriptions
      : prescriptions.handwrittenPrescriptions;

  return (
    <Screen refreshing={loadingPrescriptions} onRefresh={refreshPrescriptions}>
      <Header title="وصفاتي" subtitle="الأدوية والتوجيهات الموصوفة لك" />
      <View style={styles.tabs}>
        <Pressable
          onPress={() => setTab('digital')}
          style={[styles.tab, tab === 'digital' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'digital' && styles.activeText]}>إلكترونية</Text>
        </Pressable>
        <Pressable
          onPress={() => setTab('handwritten')}
          style={[styles.tab, tab === 'handwritten' && styles.activeTab]}>
          <Text style={[styles.tabText, tab === 'handwritten' && styles.activeText]}>مكتوبة بخط اليد</Text>
        </Pressable>
      </View>
      <ErrorBanner message={error} />
      {loadingPrescriptions && !list.length ? <LoadingState /> : null}
      {!loadingPrescriptions && !list.length ? (
        <EmptyState
          icon="document-text-outline"
          title="لا توجد وصفات"
          body="ستظهر وصفات الطبيب هنا بعد إكمال الموعد."
        />
      ) : null}
      {tab === 'digital'
        ? prescriptions.prescriptions.map((prescription) => (
            <GlassCard key={prescription.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.rx}><Text style={styles.rxText}>Rx</Text></View>
                <View style={styles.flex}>
                  <Text style={styles.doctor}>د. {prescription.doctor?.fullName ?? 'الطبيب'}</Text>
                  <Text style={styles.meta}>
                    {prescription.doctor?.specialty} •{' '}
                    {new Date(prescription.createdAt).toLocaleDateString('ar-IQ')}
                  </Text>
                </View>
              </View>
              {prescription.medications.map((medication, index) => (
                <View key={medication.id ?? `${medication.name}-${index}`} style={styles.medication}>
                  <Text style={styles.medicationName}>{medication.name}</Text>
                  <Text style={styles.dosage}>{medication.dosage}</Text>
                  {medication.instructions ? (
                    <Text style={styles.instructions}>{medication.instructions}</Text>
                  ) : null}
                  {medication.isRestricted ? (
                    <Text style={styles.restricted}>دواء مقيّد — يُصرف بوصفة</Text>
                  ) : null}
                </View>
              ))}
              {prescription.notes ? <Text style={styles.notes}>{prescription.notes}</Text> : null}
            </GlassCard>
          ))
        : prescriptions.handwrittenPrescriptions.map((prescription) => (
            <GlassCard key={prescription.id} style={styles.card}>
              <Text style={styles.doctor}>د. {prescription.doctor?.fullName ?? 'الطبيب'}</Text>
              <Text style={styles.meta}>
                {prescription.doctor?.specialty} •{' '}
                {new Date(prescription.createdAt).toLocaleDateString('ar-IQ')}
              </Text>
              <Image
                source={{ uri: api.resolveUploadUrl(prescription.imageUrl) }}
                style={styles.image}
                resizeMode="contain"
                accessibilityLabel="صورة الوصفة الطبية"
              />
              {prescription.notes ? <Text style={styles.notes}>{prescription.notes}</Text> : null}
            </GlassCard>
          ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row-reverse', borderRadius: radius.pill, padding: spacing.xs, backgroundColor: colors.surface },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radius.pill },
  activeTab: { backgroundColor: colors.primary },
  tabText: { color: colors.inkSoft, fontWeight: '700', fontSize: 13 },
  activeText: { color: colors.white },
  card: { gap: spacing.sm },
  cardHeader: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  rx: { width: 50, height: 50, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  rxText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  flex: { flex: 1 },
  doctor: { color: colors.ink, fontWeight: '800', fontSize: 17, ...rtlText },
  meta: { color: colors.inkSoft, marginTop: 3, ...rtlText },
  medication: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 3 },
  medicationName: { color: colors.ink, fontWeight: '800', ...rtlText },
  dosage: { color: colors.primaryMid, fontWeight: '700', ...rtlText },
  instructions: { color: colors.inkSoft, ...rtlText },
  restricted: { color: colors.warning, fontSize: 12, fontWeight: '700', ...rtlText },
  notes: { color: colors.inkSoft, backgroundColor: colors.primarySoft, padding: spacing.sm, borderRadius: radius.sm, lineHeight: 21, ...rtlText },
  image: { width: '100%', height: 360, borderRadius: radius.md, backgroundColor: colors.primarySoft },
});
