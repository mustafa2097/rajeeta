import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  type ViewStyle,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, formatIqd, radius, rtlText, shadow, spacing } from '@/constants/theme';
import type { Doctor } from '@/types';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
}>;

export function Screen({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  contentStyle,
}: ScreenProps) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function GlassCard({
  children,
  style,
}: PropsWithChildren<{ style?: ViewStyle | ViewStyle[] }>) {
  return (
    <BlurView intensity={38} tint="light" style={[styles.card, style]}>
      {children}
    </BlurView>
  );
}

export function AiSlopeCard({
  title,
  body,
  onPress,
}: {
  title: string;
  body: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryMid, colors.primaryLight]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.aiCard}>
        <View style={styles.aiIcon}>
          <Ionicons name="sparkles" size={24} color={colors.white} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.aiTitle}>{title}</Text>
          <Text style={styles.aiBody}>{body}</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export function Header({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  action?: ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerSide}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="رجوع">
            <Ionicons name="arrow-forward" size={22} color={colors.ink} />
          </Pressable>
        ) : (
          action
        )}
      </View>
      <View style={styles.headerText}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.headerSide}>{back ? action : null}</View>
    </View>
  );
}

export function AppInput({
  label,
  error,
  multiline,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.field}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, multiline && styles.multiline]}
        textAlign="right"
        multiline={multiline}
        {...props}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  const blocked = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      disabled={blocked}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'danger' && styles.dangerButton,
        pressed && !blocked && styles.pressed,
        blocked && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : colors.white} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={19}
              color={variant === 'secondary' ? colors.primary : colors.white}
            />
          ) : null}
          <Text
            style={[styles.buttonText, variant === 'secondary' && styles.secondaryButtonText]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      {action}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export function DoctorCard({ doctor, onPress }: { doctor: Doctor; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <GlassCard style={styles.doctorCard}>
        <View style={styles.avatar}>
          <Ionicons name="medical" color={colors.primary} size={25} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.doctorName}>د. {doctor.fullName}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{formatIqd(doctor.consultationFee)}</Text>
            <Text style={styles.meta}>★ {doctor.rating.toFixed(1)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-back" color={colors.inkSoft} size={20} />
      </GlassCard>
    </Pressable>
  );
}

export function EmptyState({
  icon = 'document-outline',
  title,
  body,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function LoadingState() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>جارٍ التحميل...</Text>
    </View>
  );
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

export function Logo({ large = false }: { large?: boolean }) {
  return (
    <Image
      source={require('../../assets/images/logo.png')}
      style={[styles.logo, large && styles.logoLarge]}
      resizeMode="contain"
      accessibilityLabel="راجيتة"
    />
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: spacing.md, gap: spacing.md, width: '100%', maxWidth: 720, alignSelf: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    overflow: 'hidden',
    ...shadow,
  },
  aiCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 140,
    ...shadow,
  },
  aiIcon: {
    height: 52,
    width: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  flex: { flex: 1, gap: spacing.xs },
  aiTitle: { color: colors.white, fontSize: 21, fontWeight: '800', ...rtlText },
  aiBody: { color: '#E9FEFF', fontSize: 14, lineHeight: 22, ...rtlText },
  header: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerSide: { width: 48, alignItems: 'center' },
  headerText: { flex: 1, alignItems: 'center' },
  headerTitle: { color: colors.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { color: colors.inkSoft, fontSize: 12, marginTop: 3, textAlign: 'center' },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  field: { gap: spacing.sm },
  label: { color: colors.ink, fontWeight: '700', fontSize: 14, ...rtlText },
  input: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    fontSize: 16,
    ...rtlText,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  errorText: { color: colors.danger, fontSize: 12, ...rtlText },
  button: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: spacing.sm,
    backgroundColor: colors.primary,
  },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  dangerButton: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.55 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryButtonText: { color: colors.primary },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontWeight: '800', fontSize: 19, ...rtlText },
  doctorCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.md },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  doctorName: { color: colors.ink, fontWeight: '800', fontSize: 16, ...rtlText },
  doctorSpecialty: { color: colors.primaryMid, fontSize: 14, ...rtlText },
  metaRow: { flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.xs },
  meta: { color: colors.inkSoft, fontSize: 12, ...rtlText },
  empty: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
  emptyIcon: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptyBody: { color: colors.inkSoft, lineHeight: 21, textAlign: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  loadingText: { color: colors.inkSoft, fontSize: 14 },
  errorBanner: { flexDirection: 'row-reverse', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FEE2E2' },
  errorBannerText: { color: colors.danger, flex: 1, ...rtlText },
  logo: { width: 140, height: 54, alignSelf: 'center' },
  logoLarge: { width: 220, height: 94 },
});
