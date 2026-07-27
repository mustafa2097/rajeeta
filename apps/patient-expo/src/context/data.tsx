import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAuth } from '@/context/auth';
import { api, ApiError } from '@/lib/api';
import type { Appointment, Doctor, PrescriptionsBundle } from '@/types';

type DataContextValue = {
  doctors: Doctor[];
  appointments: Appointment[];
  prescriptions: PrescriptionsBundle;
  loadingDoctors: boolean;
  loadingAppointments: boolean;
  loadingPrescriptions: boolean;
  error: string | null;
  refreshDoctors: (force?: boolean) => Promise<void>;
  refreshAppointments: () => Promise<void>;
  refreshPrescriptions: () => Promise<void>;
};

const emptyPrescriptions: PrescriptionsBundle = {
  prescriptions: [],
  handwrittenPrescriptions: [],
};
const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState(emptyPrescriptions);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [lastDoctorsFetch, setLastDoctorsFetch] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const captureError = (cause: unknown) =>
    setError(cause instanceof ApiError ? cause.message : 'تعذر تحميل البيانات');

  const refreshDoctors = useCallback(
    async (force = false) => {
      if (!force && doctors.length && Date.now() - lastDoctorsFetch < 60_000) return;
      setLoadingDoctors(true);
      setError(null);
      try {
        setDoctors(await api.fetchDoctors());
        setLastDoctorsFetch(Date.now());
      } catch (cause) {
        captureError(cause);
      } finally {
        setLoadingDoctors(false);
      }
    },
    [doctors.length, lastDoctorsFetch],
  );

  const refreshAppointments = useCallback(async () => {
    if (!user) return;
    setLoadingAppointments(true);
    setError(null);
    try {
      setAppointments(await api.fetchAppointments());
    } catch (cause) {
      captureError(cause);
    } finally {
      setLoadingAppointments(false);
    }
  }, [user]);

  const refreshPrescriptions = useCallback(async () => {
    if (!user) return;
    setLoadingPrescriptions(true);
    setError(null);
    try {
      setPrescriptions(await api.fetchPrescriptions());
    } catch (cause) {
      captureError(cause);
    } finally {
      setLoadingPrescriptions(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => void refreshDoctors(), 0);
    return () => clearTimeout(timer);
  }, [refreshDoctors]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      void refreshAppointments();
      void refreshPrescriptions();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, refreshAppointments, refreshPrescriptions]);

  const value = useMemo(
    () => ({
      doctors,
      appointments,
      prescriptions,
      loadingDoctors,
      loadingAppointments,
      loadingPrescriptions,
      error,
      refreshDoctors,
      refreshAppointments,
      refreshPrescriptions,
    }),
    [
      doctors,
      appointments,
      prescriptions,
      loadingDoctors,
      loadingAppointments,
      loadingPrescriptions,
      error,
      refreshDoctors,
      refreshAppointments,
      refreshPrescriptions,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
