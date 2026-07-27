import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  AiSuggestion,
  AuthResponse,
  DiscountValidation,
  DoctorHistory,
  User,
} from '@/types';
import {
  parseAppointment,
  parseAuthResponse,
  parseAvailability,
  parseDoctor,
  parsePatientProfile,
  parsePrescriptions,
  parseUser,
} from '@/lib/parsers';

const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '') ??
  'http://192.168.1.42:3001/api';
const REQUEST_TIMEOUT = 20_000;

const keys = {
  access: 'rajeeta.accessToken',
  refresh: 'rajeeta.refreshToken',
  user: 'rajeeta.user',
} as const;

const storage = {
  get: (key: string) =>
    Platform.OS === 'web'
      ? Promise.resolve(globalThis.localStorage?.getItem(key) ?? null)
      : SecureStore.getItemAsync(key),
  set: (key: string, value: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.setItem(key, value);
      return Promise.resolve();
    }
    return SecureStore.setItemAsync(key, value);
  },
  remove: (key: string) => {
    if (Platform.OS === 'web') {
      globalThis.localStorage?.removeItem(key);
      return Promise.resolve();
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  retry?: boolean;
};

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshPromise: Promise<boolean> | null = null;

  async restoreSession(): Promise<User | null> {
    const [access, refresh, rawUser] = await Promise.all([
      storage.get(keys.access),
      storage.get(keys.refresh),
      storage.get(keys.user),
    ]);
    this.accessToken = access;
    this.refreshToken = refresh;
    if (!access || !refresh || !rawUser) return null;

    try {
      return parseUser(JSON.parse(rawUser));
    } catch {
      await this.clearSession();
      return null;
    }
  }

  private async persist(auth: AuthResponse) {
    this.accessToken = auth.accessToken;
    this.refreshToken = auth.refreshToken;
    await Promise.all([
      storage.set(keys.access, auth.accessToken),
      storage.set(keys.refresh, auth.refreshToken),
      storage.set(keys.user, JSON.stringify(auth.user)),
    ]);
  }

  async persistUser(user: User) {
    await storage.set(keys.user, JSON.stringify(user));
  }

  async clearSession() {
    this.accessToken = null;
    this.refreshToken = null;
    await Promise.all([
      storage.remove(keys.access),
      storage.remove(keys.refresh),
      storage.remove(keys.user),
    ]);
  }

  private async refresh(): Promise<boolean> {
    if (!this.refreshToken) return false;
    try {
      const response = parseAuthResponse(await this.raw<unknown>('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: this.refreshToken },
        auth: false,
        retry: false,
      }));
      await this.persist(response);
      return true;
    } catch {
      await this.clearSession();
      return false;
    }
  }

  private ensureRefresh() {
    this.refreshPromise ??= this.refresh().finally(() => {
      this.refreshPromise = null;
    });
    return this.refreshPromise;
  }

  private async raw<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(options.auth !== false && this.accessToken
            ? { Authorization: `Bearer ${this.accessToken}` }
            : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });

      if (
        response.status === 401 &&
        options.auth !== false &&
        options.retry !== false &&
        (await this.ensureRefresh())
      ) {
        return this.raw<T>(path, { ...options, retry: false });
      }

      const data = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          typeof data?.message === 'string'
            ? data.message
            : Array.isArray(data?.message)
              ? data.message.join('، ')
              : 'حدث خطأ غير متوقع';
        throw new ApiError(message, response.status);
      }
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError('انتهت مهلة الاتصال بالخادم، حاول مجدداً', 408);
      }
      throw new ApiError('تعذر الاتصال بالخادم', 0);
    } finally {
      clearTimeout(timeout);
    }
  }

  async login(identifier: string, password: string) {
    const auth = parseAuthResponse(await this.raw<unknown>('/auth/login', {
      method: 'POST',
      auth: false,
      body: { identifier, password },
    }));
    await this.persist(auth);
    return auth;
  }

  async registerPatient(payload: {
    email: string;
    phone: string;
    password: string;
    fullName: string;
    age: number;
    bloodType?: string;
    chronicDiseases?: string[];
  }) {
    const auth = parseAuthResponse(await this.raw<unknown>('/auth/register/patient', {
      method: 'POST',
      auth: false,
      body: payload,
    }));
    await this.persist(auth);
    return auth;
  }

  async fetchMe() {
    const user = parseUser(await this.raw<unknown>('/auth/me'));
    await this.persistUser(user);
    return user;
  }

  fetchPatientProfile() {
    return this.raw<unknown>('/patients/me').then(parsePatientProfile);
  }

  async deleteAccount() {
    await this.raw<void>('/auth/account', { method: 'DELETE' });
    await this.clearSession();
  }

  fetchDoctors(specialty?: string) {
    const query = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
    return this.raw<unknown>(`/doctors${query}`, { auth: false }).then((value) =>
      Array.isArray(value) ? value.map(parseDoctor) : [],
    );
  }

  fetchDoctor(id: string) {
    return this.raw<unknown>(`/doctors/${id}`, { auth: false }).then(parseDoctor);
  }

  fetchAvailability(doctorId: string) {
    return this.raw<unknown>(`/availability/${doctorId}`, { auth: false }).then((value) =>
      Array.isArray(value) ? value.map(parseAvailability) : [],
    );
  }

  fetchDoctorHistory(doctorId: string, patientId: string) {
    return this.raw<DoctorHistory>(`/doctors/${doctorId}/history/${patientId}`);
  }

  validateDiscount(code: string) {
    return this.raw<DiscountValidation>(
      `/discount-codes/validate/${encodeURIComponent(code)}`,
      { auth: false },
    );
  }

  createAppointment(payload: {
    doctorId: string;
    scheduledAt: string;
    discountCode?: string;
    notes?: string;
    paymentMethod: 'CASH' | 'ELECTRONIC';
  }) {
    return this.raw<unknown>('/appointments', {
      method: 'POST',
      body: payload,
    }).then(parseAppointment);
  }

  payConsultation(appointmentId: string) {
    return this.raw<void>('/payments/consultation', {
      method: 'POST',
      body: { appointmentId },
    });
  }

  fetchAppointments() {
    return this.raw<unknown>('/appointments/mine').then((value) =>
      Array.isArray(value) ? value.map(parseAppointment) : [],
    );
  }

  fetchPrescriptions() {
    return this.raw<unknown>('/prescriptions/mine').then(parsePrescriptions);
  }

  suggestDoctors(diagnosis: string) {
    return this.raw<AiSuggestion>('/ai/suggest-doctors', {
      method: 'POST',
      auth: false,
      body: { diagnosis },
    }).then((result) => ({ ...result, doctors: (result.doctors ?? []).map(parseDoctor) }));
  }

  resolveUploadUrl(path: string) {
    if (/^https?:\/\//.test(path)) return path;
    const origin = new URL(API_URL).origin;
    return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
  }
}

export const api = new ApiClient();
export { API_URL };
