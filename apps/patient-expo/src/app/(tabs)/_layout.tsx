import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

const icons = {
  index: ['home-outline', 'home'],
  appointments: ['calendar-outline', 'calendar'],
  ai: ['sparkles-outline', 'sparkles'],
  prescriptions: ['document-text-outline', 'document-text'],
  profile: ['person-outline', 'person'],
} as const;

export default function TabsLayout() {
  const { user, loading } = useAuth();
  if (!loading && !user) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkSoft,
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        tabBarIcon: ({ color, focused, size }) => {
          const pair = icons[route.name as keyof typeof icons] ?? icons.index;
          return <Ionicons name={pair[focused ? 1 : 0]} color={color} size={size} />;
        },
      })}>
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="appointments" options={{ title: 'مواعيدي' }} />
      <Tabs.Screen name="ai" options={{ title: 'المساعد' }} />
      <Tabs.Screen name="prescriptions" options={{ title: 'وصفاتي' }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي' }} />
    </Tabs>
  );
}
