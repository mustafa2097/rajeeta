import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FileMeta, Message, ServerInfo } from './types';

const SERVER_KEY = 'server_url';
const PIN_KEY = 'pin';

export async function getServerUrl(): Promise<string> {
  return (await AsyncStorage.getItem(SERVER_KEY)) || '';
}

export async function setServerUrl(url: string) {
  await AsyncStorage.setItem(SERVER_KEY, url.replace(/\/$/, ''));
}

export async function getPin(): Promise<string> {
  return (await AsyncStorage.getItem(PIN_KEY)) || '';
}

export async function setPin(pin: string) {
  await AsyncStorage.setItem(PIN_KEY, pin);
}

function headers(pin?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (pin) h['X-Pin'] = pin;
  return h;
}

async function request<T>(base: string, path: string, init?: RequestInit, pin?: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { ...headers(pin), ...(init?.headers as Record<string, string>) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function testConnection(base: string): Promise<ServerInfo> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${base}/api/info`, { signal: controller.signal });
    if (!res.ok) throw new Error('Server not reachable');
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function verifyPin(base: string, pin: string): Promise<boolean> {
  const res = await request<{ valid: boolean }>(base, '/api/pin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return res.valid;
}

export async function getFiles(base: string, pin?: string): Promise<FileMeta[]> {
  return request(base, '/api/files', undefined, pin);
}

export async function uploadFile(
  base: string,
  uri: string,
  name: string,
  mimeType: string,
  pin?: string,
): Promise<FileMeta> {
  const form = new FormData();
  form.append('file', { uri, name, type: mimeType } as unknown as Blob);
  form.append('from', 'phone');
  const res = await fetch(`${base}/api/upload`, {
    method: 'POST',
    headers: headers(pin),
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function deleteFile(base: string, id: string, pin?: string) {
  return request(base, `/api/files/${id}`, { method: 'DELETE' }, pin);
}

export async function getMessages(base: string, pin?: string): Promise<Message[]> {
  return request(base, '/api/messages', undefined, pin);
}

export async function sendMessage(base: string, text: string, pin?: string): Promise<Message> {
  return request(base, '/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from: 'phone' }),
  }, pin);
}

export async function syncClipboard(base: string, text: string, pin?: string) {
  return request(base, '/api/clipboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from: 'phone' }),
  }, pin);
}

export function downloadUrl(base: string, id: string, pin?: string): string {
  const q = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  return `${base}/api/download/${id}${q}`;
}

export function previewUrl(base: string, id: string): string {
  return `${base}/api/preview/${id}`;
}

export function parseQrUrl(data: string): string {
  let url = data.trim();
  if (!url.startsWith('http')) url = `http://${url}`;
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return url;
  }
}
