import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import {
  AppInput,
  ErrorBanner,
  Header,
  Logo,
  PrimaryButton,
  Screen,
} from '@/components/ui';
import { colors, rtlText, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function LoginScreen() {
  const router = useRouter();
  const { login, busy, error, clearError } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    clearError();
    if (await login(identifier, password)) router.replace('/(tabs)');
  };

  return (
    <Screen>
      <Header title="تسجيل الدخول" back />
      <Logo />
      <View style={styles.intro}>
        <Text style={styles.title}>أهلاً بعودتك</Text>
        <Text style={styles.subtitle}>استخدم بريدك الإلكتروني أو رقم هاتفك للمتابعة.</Text>
      </View>
      <ErrorBanner message={error} />
      <AppInput
        label="البريد الإلكتروني أو رقم الهاتف"
        placeholder="example@email.com"
        value={identifier}
        onChangeText={setIdentifier}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <AppInput
        label="كلمة المرور"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <PrimaryButton
        title="دخول"
        icon="log-in-outline"
        onPress={submit}
        loading={busy}
        disabled={!identifier.trim() || password.length < 6}
      />
      <Link href="/register" asChild>
        <Text style={styles.link}>ليس لديك حساب؟ أنشئ حساباً جديداً</Text>
      </Link>
      <View style={styles.legalRow}>
        <Link href="/legal/privacy" style={styles.legal}>سياسة الخصوصية</Link>
        <Text style={styles.dot}>•</Text>
        <Link href="/legal/terms" style={styles.legal}>شروط الاستخدام</Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.sm, marginBottom: spacing.sm },
  title: { color: colors.ink, fontSize: 27, fontWeight: '900', ...rtlText },
  subtitle: { color: colors.inkSoft, lineHeight: 23, ...rtlText },
  link: { color: colors.primaryMid, fontWeight: '700', textAlign: 'center', padding: spacing.sm },
  legalRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: spacing.sm },
  legal: { color: colors.inkSoft, fontSize: 12 },
  dot: { color: colors.inkSoft },
});
