import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { GlassCard, Header, PrimaryButton, Screen } from '@/components/ui';
import { colors, radius, rtlText, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { api, ApiError } from '@/lib/api';

const Row = ({
  icon,
  title,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value?: string;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress} disabled={!onPress} style={styles.row}>
    <Ionicons name="chevron-back" size={18} color={onPress ? colors.inkSoft : 'transparent'} />
    <View style={styles.rowText}>
      <Text style={styles.rowTitle}>{title}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
  </Pressable>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const profile = user?.patientProfile;

  const confirmDelete = () => {
    Alert.alert(
      'حذف الحساب',
      'سيتم حذف حسابك وبياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteAccount();
              await logout();
              router.replace('/welcome');
            } catch (cause) {
              Alert.alert('تعذر حذف الحساب', cause instanceof ApiError ? cause.message : 'حاول مجدداً');
            }
          },
        },
      ],
    );
  };

  return (
    <Screen>
      <Header title="حسابي" subtitle="بياناتك وإعدادات التطبيق" />
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.fullName ?? user?.email ?? 'ر').slice(0, 1)}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.fullName ?? 'مستخدم راجيتة'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <GlassCard style={styles.group}>
        <Row icon="call-outline" title="رقم الهاتف" value={user?.phone || 'غير محدد'} />
        <View style={styles.divider} />
        <Row icon="calendar-outline" title="العمر" value={profile?.age ? `${profile.age} سنة` : 'غير محدد'} />
        <View style={styles.divider} />
        <Row icon="water-outline" title="فصيلة الدم" value={profile?.bloodType || 'غير محددة'} />
        <View style={styles.divider} />
        <Row
          icon="fitness-outline"
          title="الأمراض المزمنة"
          value={profile?.chronicDiseases?.join('، ') || 'لا يوجد'}
        />
      </GlassCard>

      <GlassCard style={styles.group}>
        <Row icon="shield-checkmark-outline" title="سياسة الخصوصية" onPress={() => router.push('/legal/privacy')} />
        <View style={styles.divider} />
        <Row icon="document-text-outline" title="شروط الاستخدام" onPress={() => router.push('/legal/terms')} />
        <View style={styles.divider} />
        <Row icon="information-circle-outline" title="إصدار التطبيق" value="1.0.0" />
      </GlassCard>

      <PrimaryButton
        title="تسجيل الخروج"
        icon="log-out-outline"
        variant="secondary"
        onPress={async () => {
          await logout();
          router.replace('/welcome');
        }}
      />
      <PrimaryButton
        title="حذف الحساب نهائياً"
        icon="trash-outline"
        variant="danger"
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { color: colors.white, fontSize: 36, fontWeight: '900' },
  name: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  email: { color: colors.inkSoft },
  group: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
  row: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: colors.ink, fontWeight: '700', ...rtlText },
  rowValue: { color: colors.inkSoft, fontSize: 12, ...rtlText },
  rowIcon: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: colors.border },
});
