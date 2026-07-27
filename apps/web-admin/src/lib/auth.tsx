'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  clearAuth,
  getStoredTokens,
  getStoredUser,
  saveAuth,
  saveUser,
} from './api';
import type { AuthResponse, Role, User } from './types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<User>;
  registerDoctor: (payload: RegisterDoctorPayload) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
  hasRole: (role: Role | Role[]) => boolean;
}

export interface RegisterDoctorPayload {
  phone: string;
  password: string;
  email: string;
  fullName: string;
  age: number;
  specialty: string;
  clinicName: string;
  clinicAddress: string;
  clinicFloor: string;
  consultationFee: number;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    const { accessToken } = getStoredTokens();
    if (storedUser && accessToken) {
      setUser(storedUser);
      api<User>('/auth/me')
        .then((fresh) => {
          saveUser(fresh);
          setUser(fresh);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const applyAuth = useCallback((data: AuthResponse) => {
    saveAuth(data);
    setUser(data.user);
    return data.user;
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const data = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ identifier, password }),
      });
      return applyAuth(data);
    },
    [applyAuth],
  );

  const registerDoctor = useCallback(
    async (payload: RegisterDoctorPayload) => {
      const data = await api<AuthResponse>('/auth/register/doctor', {
        method: 'POST',
        auth: false,
        body: JSON.stringify(payload),
      });
      return applyAuth(data);
    },
    [applyAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const fresh = await api<User>('/auth/me');
      saveUser(fresh);
      setUser(fresh);
      return fresh;
    } catch {
      clearAuth();
      setUser(null);
      return null;
    }
  }, []);

  const hasRole = useCallback(
    (role: Role | Role[]) => {
      if (!user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(user.role);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      registerDoctor,
      logout,
      refreshUser,
      hasRole,
    }),
    [user, loading, login, registerDoctor, logout, refreshUser, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
