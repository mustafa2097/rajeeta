import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppInput,
  ErrorBanner,
  GlassCard,
  Header,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { colors, radius, rtlText, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, busy, error, clearError } = useAuth();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',
    age: '',
    bloodType: '',
    chronicDiseases: '',
  });
  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validation =
    !form.fullName.trim()
      ? 'اكتب الاسم الكامل'
      : !form.email.includes('@')
        ? 'اكتب بريداً إلكترونياً صحيحاً'
        : form.phone.trim().length < 8
          ? 'اكتب رقم هاتف صحيحاً'
          : Number(form.age) < 1
            ? 'اكتب العمر'
            : form.password.length < 8
              ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
              : form.password !== form.confirm
                ? 'كلمتا المرور غير متطابقتين'
                : null;

  const submit = async () => {
    clearError();
    if (validation) return;
    const ok = await register({
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
      age: Number(form.age),
      bloodType: form.bloodType || undefined,
      chronicDiseases: form.chronicDiseases
        .split(/[،,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    });
    if (ok) router.replace('/(tabs)');
  };

  return (
    <Screen>
      <Header title="إنشاء حساب" subtitle="بياناتك محفوظة بأمان" back />
      <ErrorBanner message={error} />
      <GlassCard style={styles.form}>
        <AppInput label="الاسم الكامل" value={form.fullName} onChangeText={(v) => update('fullName', v)} />
        <AppInput
          label="البريد الإلكتروني"
          value={form.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="رقم الهاتف"
          value={form.phone}
          onChangeText={(v) => update('phone', v)}
          keyboardType="phone-pad"
        />
        <AppInput
          label="العمر"
          value={form.age}
          onChangeText={(v) => update('age', v.replace(/\D/g, ''))}
          keyboardType="number-pad"
        />
        <Text style={styles.label}>فصيلة الدم (اختياري)</Text>
        <View style={styles.chips}>
          {bloodTypes.map((type) => (
            <Pressable
              key={type}
              onPress={() => update('bloodType', type)}
              style={[styles.chip, form.bloodType === type && styles.selectedChip]}>
              <Text style={[styles.chipText, form.bloodType === type && styles.selectedChipText]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
        <AppInput
          label="الأمراض المزمنة (اختياري)"
          placeholder="مثال: السكري، ضغط الدم"
          value={form.chronicDiseases}
          onChangeText={(v) => update('chronicDiseases', v)}
        />
        <AppInput
          label="كلمة المرور"
          value={form.password}
          onChangeText={(v) => update('password', v)}
          secureTextEntry
        />
        <AppInput
          label="تأكيد كلمة المرور"
          value={form.confirm}
          onChangeText={(v) => update('confirm', v)}
          secureTextEntry
        />
      </GlassCard>
      {validation && Object.values(form).some(Boolean) ? (
        <Text style={styles.validation}>{validation}</Text>
      ) : null}
      <PrimaryButton title="إنشاء الحساب" onPress={submit} loading={busy} disabled={Boolean(validation)} />
      <Text style={styles.agreement}>
        بإنشاء الحساب فإنك توافق على شروط الاستخدام وسياسة الخصوصية.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  label: { color: colors.ink, fontWeight: '700', fontSize: 14, ...rtlText },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  chip: { minWidth: 52, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selectedChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, textAlign: 'center', fontWeight: '700' },
  selectedChipText: { color: colors.white },
  validation: { color: colors.danger, ...rtlText },
  agreement: { color: colors.inkSoft, fontSize: 12, lineHeight: 19, textAlign: 'center' },
});
