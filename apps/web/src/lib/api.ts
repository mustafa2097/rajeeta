import type { AuthResponse, User } from './types';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

const STORAGE_KEYS = {
  accessToken: 'accessToken',
  refreshToken: 'refreshToken',
  user: 'user',
} as const;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getStoredTokens() {
  if (!isBrowser()) {
    return { accessToken: null, refreshToken: null };
  }
  return {
    accessToken: localStorage.getItem(STORAGE_KEYS.accessToken),
    refreshToken: localStorage.getItem(STORAGE_KEYS.refreshToken),
  };
}

export function getStoredUser(): User | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function saveAuth(data: AuthResponse) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.refreshToken, data.refreshToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
}

export function saveUser(user: User) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
}

export function clearAuth() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

let refreshPromise: Promise<AuthResponse | null> | null = null;

async function refreshTokens(): Promise<AuthResponse | null> {
  const { refreshToken } = getStoredTokens();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearAuth();
      return null;
    }

    const data = (await res.json()) as AuthResponse;
    saveAuth(data);
    return data;
  } catch {
    clearAuth();
    return null;
  }
}

async function ensureFreshTokens() {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function extractErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;
  const message = (data as { message?: string | string[] }).message;
  if (Array.isArray(message)) return message.join('، ');
  if (typeof message === 'string') return message;
  return fallback;
}

export type ApiOptions = RequestInit & {
  auth?: boolean;
  formData?: boolean;
};

export async function api<T = unknown>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { auth = true, formData = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (!formData && !requestHeaders.has('Content-Type') && rest.body) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const { accessToken } = getStoredTokens();
    if (accessToken) {
      requestHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
  }

  let response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (response.status === 401 && auth) {
    const refreshed = await ensureFreshTokens();
    if (refreshed?.accessToken) {
      requestHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`);
      response = await fetch(`${API_URL}${path}`, {
        ...rest,
        headers: requestHeaders,
      });
    } else {
      clearAuth();
      if (isBrowser() && !window.location.pathname.includes('/login')) {
        window.location.href = '/doctor/login';
      }
      throw new ApiError('انتهت الجلسة، يرجى تسجيل الدخول مجدداً', 401);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data, 'حدث خطأ غير متوقع'),
      response.status,
      data,
    );
  }

  return data as T;
}

export function apiUpload<T = unknown>(
  path: string,
  body: FormData,
  options: Omit<ApiOptions, 'body' | 'formData'> = {},
) {
  return api<T>(path, {
    ...options,
    method: 'POST',
    body,
    formData: true,
  });
}
