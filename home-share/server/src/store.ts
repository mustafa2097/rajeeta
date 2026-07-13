import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import {
  FileMeta,
  Message,
  UPLOAD_DIR,
  CONFIG_PATH,
  FILES_PATH,
  MESSAGES_PATH,
  MAX_FILE_SIZE,
  loadJson,
  saveJson,
  AppConfig,
} from './utils';

let files: FileMeta[] = loadJson<FileMeta[]>(FILES_PATH, []);
let messages: Message[] = loadJson<Message[]>(MESSAGES_PATH, []);
let config: AppConfig = loadJson<AppConfig>(CONFIG_PATH, { pin: null });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (_req, _file, cb) => cb(null, uuid()),
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

export function getFiles() {
  return files;
}

export function getMessages() {
  return messages;
}

export function getConfig() {
  return config;
}

export function setPin(pin: string | null) {
  config = { pin };
  saveJson(CONFIG_PATH, config);
}

export function verifyPin(req: Request, res: Response, next: NextFunction) {
  if (!config.pin) return next();
  const headerPin = req.headers['x-pin'] as string | undefined;
  const bodyPin = req.body?.pin as string | undefined;
  const queryPin = req.query.pin as string | undefined;
  const pin = headerPin || bodyPin || queryPin;
  if (pin === config.pin) return next();
  return res.status(401).json({ error: 'Invalid PIN' });
}

export function addFile(meta: FileMeta) {
  files.unshift(meta);
  if (files.length > 200) {
    const removed = files.splice(200);
    for (const f of removed) {
      const fp = path.join(UPLOAD_DIR, f.id);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  }
  saveJson(FILES_PATH, files);
  return meta;
}

export function deleteFile(id: string): boolean {
  const idx = files.findIndex((f) => f.id === id);
  if (idx === -1) return false;
  const [removed] = files.splice(idx, 1);
  const fp = path.join(UPLOAD_DIR, removed.id);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
  saveJson(FILES_PATH, files);
  return true;
}

export function addMessage(msg: Message) {
  messages.unshift(msg);
  if (messages.length > 500) messages = messages.slice(0, 500);
  saveJson(MESSAGES_PATH, messages);
  return msg;
}

export function clearMessages() {
  messages = [];
  saveJson(MESSAGES_PATH, messages);
}

export function clearFiles() {
  for (const f of files) {
    const fp = path.join(UPLOAD_DIR, f.id);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }
  files = [];
  saveJson(FILES_PATH, files);
}

export function getFilePath(id: string): string | null {
  const meta = files.find((f) => f.id === id);
  if (!meta) return null;
  const fp = path.join(UPLOAD_DIR, id);
  return fs.existsSync(fp) ? fp : null;
}

export function getFileMeta(id: string): FileMeta | undefined {
  return files.find((f) => f.id === id);
}

export function createFileMeta(
  file: Express.Multer.File,
  from: string,
): FileMeta {
  return {
    id: path.basename(file.filename),
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype || 'application/octet-stream',
    from,
    createdAt: new Date().toISOString(),
  };
}

export function createMessage(text: string, from: string): Message {
  return {
    id: uuid(),
    text: text.trim(),
    from,
    createdAt: new Date().toISOString(),
  };
}
