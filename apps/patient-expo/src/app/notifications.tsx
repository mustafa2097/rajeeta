import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, GlassCard, Header, Screen } from '@/components/ui';
import { colors, radius, rtlText, spacing, statusLabel } from '@/constants/theme';
import { useData } from '@/context/data';

export default function NotificationsScreen() {
  const { appointments, loadingAppointments, refreshAppointments } = useData();
  const notifications = [...appointments]
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt))
    .slice(0, 20);

  return (
    <Screen refreshing={loadingAppointments} onRefresh={refreshAppointments}>
      <Header title="الإشعارات" subtitle="آخر تحديثات حجوزاتك" back />
      {!notifications.length ? (
        <EmptyState
          icon="notifications-outline"
          title="لا توجد إشعارات"
          body="سنخبرك هنا عند تأكيد موعد أو تحديث حالته."
        />
      ) : null}
      {notifications.map((item) => (
        <GlassCard key={item.id} style={styles.item}>
          <View style={styles.icon}>
            <Ionicons
              name={item.status === 'CONFIRMED' ? 'checkmark-circle' : 'calendar'}
              size={23}
              color={colors.primary}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>موعدك مع د. {item.doctor?.fullName ?? 'الطبيب'}</Text>
            <Text style={styles.body}>
              الحالة: {statusLabel(item.status)} •{' '}
              {new Date(item.scheduledAt).toLocaleDateString('ar-IQ')}
            </Text>
          </View>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row-reverse', gap: spacing.md, alignItems: 'center' },
  icon: { width: 46, height: 46, borderRadius: radius.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: spacing.xs },
  title: { color: colors.ink, fontWeight: '800', ...rtlText },
  body: { color: colors.inkSoft, fontSize: 13, ...rtlText },
});
