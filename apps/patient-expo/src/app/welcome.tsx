import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Logo, PrimaryButton, Screen } from '@/components/ui';
import { colors, radius, rtlText, spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  if (user) return <Redirect href="/(tabs)" />;

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.logoArea}>
        <View style={styles.logoHalo}>
          <Logo large />
        </View>
        <Text style={styles.title}>رعايتك الصحية أقرب</Text>
        <Text style={styles.subtitle}>
          احجز موعدك، تابع وصفاتك، واستفد من مساعد راجيتة الذكي في مكان واحد.
        </Text>
      </View>
      <LinearGradient
        colors={[colors.primaryDark, colors.primaryMid, colors.primary]}
        style={styles.panel}>
        <Text style={styles.panelTitle}>ابدأ رحلة صحية أبسط</Text>
        <Text style={styles.panelBody}>أطباء موثوقون ومواعيد واضحة بواجهة عربية سهلة.</Text>
        <PrimaryButton title="تسجيل الدخول" onPress={() => router.push('/login')} />
        <PrimaryButton
          title="إنشاء حساب جديد"
          variant="secondary"
          onPress={() => router.push('/register')}
        />
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', paddingTop: spacing.xl, paddingBottom: spacing.lg },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  logoHalo: {
    width: 250,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  title: { color: colors.ink, fontSize: 29, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.inkSoft, lineHeight: 25, fontSize: 16, maxWidth: 330, textAlign: 'center', writingDirection: 'rtl' },
  panel: { borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  panelTitle: { color: colors.white, fontSize: 21, fontWeight: '800', ...rtlText },
  panelBody: { color: '#DDFBFF', lineHeight: 22, ...rtlText },
});
