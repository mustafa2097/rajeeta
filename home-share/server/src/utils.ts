import fs from 'fs';
import path from 'path';
import os from 'os';

export interface FileMeta {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  from: string;
  createdAt: string;
}

export interface Message {
  id: string;
  text: string;
  from: string;
  createdAt: string;
}

export interface ServerInfo {
  hostname: string;
  ips: string[];
  port: number;
  pinEnabled: boolean;
  deviceCount: number;
}

const baseDir = process.env.HOME_SHARE_DATA || path.join(__dirname, '..');

export const UPLOAD_DIR = path.join(baseDir, 'uploads');
export const DATA_DIR = path.join(baseDir, 'data');
export const CONFIG_PATH = path.join(DATA_DIR, 'config.json');
export const FILES_PATH = path.join(DATA_DIR, 'files.json');
export const MESSAGES_PATH = path.join(DATA_DIR, 'messages.json');

export const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB

export function ensureDirs() {
  for (const dir of [UPLOAD_DIR, DATA_DIR]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch {
    /* ignore corrupt files */
  }
  return fallback;
}

export function saveJson<T>(filePath: string, data: T) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export interface AppConfig {
  pin: string | null;
}

export function getLocalIps(): string[] {
  const ips: string[] = [];
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    const addrs = nets[name];
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        ips.push(addr.address);
      }
    }
  }
  return ips;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
