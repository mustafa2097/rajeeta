import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import {
  AppInput,
  DoctorCard,
  EmptyState,
  ErrorBanner,
  Header,
  LoadingState,
  Screen,
} from '@/components/ui';
import { useData } from '@/context/data';

export default function SpecialtyDoctorsScreen() {
  const { name = '' } = useLocalSearchParams<{ name?: string }>();
  const router = useRouter();
  const { doctors, loadingDoctors, error, refreshDoctors } = useData();
  const [search, setSearch] = useState('');
  const visible = useMemo(
    () =>
      doctors.filter((doctor) => {
        const specialtyMatches = !name || doctor.specialty.includes(name);
        const searchMatches =
          !search.trim() ||
          doctor.fullName.includes(search.trim()) ||
          doctor.specialty.includes(search.trim());
        return specialtyMatches && searchMatches;
      }),
    [doctors, name, search],
  );

  return (
    <Screen refreshing={loadingDoctors} onRefresh={() => refreshDoctors(true)}>
      <Header title={name ? `أطباء ${name}` : 'جميع الأطباء'} back />
      <AppInput
        placeholder="ابحث باسم الطبيب أو التخصص"
        value={search}
        onChangeText={setSearch}
      />
      <ErrorBanner message={error} />
      {loadingDoctors && !doctors.length ? <LoadingState /> : null}
      {!loadingDoctors && !visible.length ? (
        <EmptyState
          icon="search-outline"
          title="لا توجد نتائج"
          body="جرّب تخصصاً آخر أو غيّر عبارة البحث."
        />
      ) : null}
      {visible.map((doctor) => (
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
