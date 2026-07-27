import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api, ApiError } from '@/lib/api';
import type { User } from '@/types';

type RegisterInput = {
  email: string;
  phone: string;
  password: string;
  fullName: string;
  age: number;
  bloodType?: string;
  chronicDiseases?: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const cached = await api.restoreSession();
      if (!active) return;
      setUser(cached);
      if (cached) {
        try {
          const fresh = await api.fetchMe();
          if (active) setUser(fresh);
        } catch {
          // Keep the cached account during a temporary network outage.
        }
      }
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    setBusy(true);
    setError(null);
    try {
      const auth = await api.login(identifier.trim(), password);
      if (auth.user.role !== 'PATIENT') {
        await api.clearSession();
        setError('هذا الحساب ليس حساب مريض');
        return false;
      }
      setUser(auth.user);
      return true;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر تسجيل الدخول');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    setBusy(true);
    setError(null);
    try {
      const auth = await api.registerPatient(input);
      setUser(auth.user);
      return true;
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر إنشاء الحساب');
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.clearSession();
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await api.fetchMe();
    setUser(fresh);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      busy,
      error,
      login,
      register,
      logout,
      refreshUser,
      clearError: () => setError(null),
    }),
    [user, loading, busy, error, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
