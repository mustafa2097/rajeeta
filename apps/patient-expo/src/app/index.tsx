import { Redirect } from 'expo-router';

import { LoadingState, Screen } from '@/components/ui';
import { useAuth } from '@/context/auth';

export default function Index() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }
  return <Redirect href={user ? '/(tabs)' : '/welcome'} />;
}
