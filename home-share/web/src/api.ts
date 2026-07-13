import type { FileMeta, Message, ServerInfo } from './types';

const SERVER = import.meta.env.VITE_SERVER_URL || '';

function headers(pin?: string): HeadersInit {
  const h: HeadersInit = {};
  if (pin) h['X-Pin'] = pin;
  return h;
}

async function request<T>(path: string, init?: RequestInit, pin?: string): Promise<T> {
  const res = await fetch(`${SERVER}${path}`, {
    ...init,
    headers: { ...headers(pin), ...init?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export async function getInfo(): Promise<ServerInfo> {
  return request('/api/info');
}

export async function verifyPin(pin: string): Promise<boolean> {
  const res = await request<{ valid: boolean }>('/api/pin/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return res.valid;
}

export async function setPin(pin: string | null, currentPin?: string): Promise<void> {
  await request('/api/pin/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  }, currentPin);
}

export async function getFiles(pin?: string): Promise<FileMeta[]> {
  return request('/api/files', undefined, pin);
}

export async function uploadFile(file: File, from: string, pin?: string): Promise<FileMeta> {
  const form = new FormData();
  form.append('file', file);
  form.append('from', from);
  const res = await fetch(`${SERVER}/api/upload`, {
    method: 'POST',
    headers: headers(pin),
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export function downloadUrl(id: string, pin?: string): string {
  const q = pin ? `?pin=${encodeURIComponent(pin)}` : '';
  return `${SERVER}/api/download/${id}${q}`;
}

export function previewUrl(id: string): string {
  return `${SERVER}/api/preview/${id}`;
}

export async function deleteFile(id: string, pin?: string): Promise<void> {
  await request(`/api/files/${id}`, { method: 'DELETE' }, pin);
}

export async function clearFiles(pin?: string): Promise<void> {
  await request('/api/files', { method: 'DELETE' }, pin);
}

export async function getMessages(pin?: string): Promise<Message[]> {
  return request('/api/messages', undefined, pin);
}

export async function sendMessage(text: string, from: string, pin?: string): Promise<Message> {
  return request('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from }),
  }, pin);
}

export async function clearMessages(pin?: string): Promise<void> {
  await request('/api/messages', { method: 'DELETE' }, pin);
}

export async function syncClipboard(text: string, from: string, pin?: string): Promise<void> {
  await request('/api/clipboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, from }),
  }, pin);
}

export { SERVER };
