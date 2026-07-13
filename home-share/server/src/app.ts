import express, { Express } from 'express';
import cors from 'cors';
import { createServer, Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  ensureDirs,
  getLocalIps,
  formatBytes,
} from './utils';
import {
  upload,
  verifyPin,
  getFiles,
  getMessages,
  getConfig,
  setPin,
  addFile,
  deleteFile,
  addMessage,
  clearMessages,
  clearFiles,
  getFilePath,
  getFileMeta,
  createFileMeta,
  createMessage,
} from './store';

const connectedDevices = new Map<string, { name: string; type: string }>();

export function createApp(): { app: Express; httpServer: HttpServer; io: SocketServer } {
  ensureDirs();

  const app = express();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] },
  });

  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/info', (_req, res) => {
    const ips = getLocalIps();
    const port = Number(process.env.PORT) || 3847;
    res.json({
      hostname: os.hostname(),
      ips,
      port,
      pinEnabled: !!getConfig().pin,
      deviceCount: connectedDevices.size,
      urls: ips.map((ip) => `http://${ip}:${port}`),
    });
  });

  app.post('/api/pin/verify', (req, res) => {
    const { pin } = req.body;
    const config = getConfig();
    if (!config.pin) return res.json({ valid: true });
    res.json({ valid: pin === config.pin });
  });

  app.post('/api/pin/set', verifyPin, (req, res) => {
    const { pin } = req.body;
    if (pin && (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin))) {
      return res.status(400).json({ error: 'PIN must be 4-6 digits' });
    }
    setPin(pin || null);
    io.emit('pin-changed', { pinEnabled: !!pin });
    res.json({ pinEnabled: !!pin });
  });

  app.get('/api/files', verifyPin, (_req, res) => res.json(getFiles()));

  app.post('/api/upload', verifyPin, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const from = (req.body.from as string) || 'unknown';
    const meta = createFileMeta(req.file, from);
    addFile(meta);
    io.emit('new-file', meta);
    res.json(meta);
  });

  app.get('/api/download/:id', verifyPin, (req, res) => {
    const id = String(req.params.id);
    const meta = getFileMeta(id);
    if (!meta) return res.status(404).json({ error: 'File not found' });
    const fp = getFilePath(id);
    if (!fp) return res.status(404).json({ error: 'File missing on disk' });
    res.download(fp, meta.name);
  });

  app.get('/api/preview/:id', verifyPin, (req, res) => {
    const id = String(req.params.id);
    const meta = getFileMeta(id);
    if (!meta) return res.status(404).json({ error: 'File not found' });
    const fp = getFilePath(id);
    if (!fp) return res.status(404).json({ error: 'File missing on disk' });
    res.setHeader('Content-Type', meta.mimeType);
    res.sendFile(fp);
  });

  app.delete('/api/files/:id', verifyPin, (req, res) => {
    const id = String(req.params.id);
    const ok = deleteFile(id);
    if (!ok) return res.status(404).json({ error: 'File not found' });
    io.emit('file-deleted', { id });
    res.json({ ok: true });
  });

  app.delete('/api/files', verifyPin, (_req, res) => {
    clearFiles();
    io.emit('files-cleared');
    res.json({ ok: true });
  });

  app.get('/api/messages', verifyPin, (_req, res) => res.json(getMessages()));

  app.post('/api/messages', verifyPin, (req, res) => {
    const { text, from } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
    const msg = createMessage(text, from || 'unknown');
    addMessage(msg);
    io.emit('new-message', msg);
    res.json(msg);
  });

  app.delete('/api/messages', verifyPin, (_req, res) => {
    clearMessages();
    io.emit('messages-cleared');
    res.json({ ok: true });
  });

  app.post('/api/clipboard', verifyPin, (req, res) => {
    const { text, from } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text required' });
    const payload = { text: text.trim(), from: from || 'unknown', at: new Date().toISOString() };
    io.emit('clipboard', payload);
    res.json(payload);
  });

  io.on('connection', (socket) => {
    socket.on('register', ({ name, type }: { name: string; type: string }) => {
      connectedDevices.set(socket.id, { name, type });
      io.emit('devices', Array.from(connectedDevices.values()));
    });
    socket.on('disconnect', () => {
      connectedDevices.delete(socket.id);
      io.emit('devices', Array.from(connectedDevices.values()));
    });
  });

  const webDist = process.env.WEB_DIST;
  if (webDist && fs.existsSync(webDist)) {
    app.use(express.static(webDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
      res.sendFile(path.join(webDist, 'index.html'));
    });
  }

  return { app, httpServer, io };
}

export function startServer(port = Number(process.env.PORT) || 3847): Promise<number> {
  const { httpServer } = createApp();
  return new Promise((resolve, reject) => {
    httpServer.listen(port, '0.0.0.0', () => {
      const ips = getLocalIps();
      console.log('\n🏠 Home Share Server running!\n');
      console.log(`   Local:   http://localhost:${port}`);
      for (const ip of ips) {
        console.log(`   Network: http://${ip}:${port}`);
      }
      console.log(`\n   Max file size: ${formatBytes(1024 * 1024 * 1024)}\n`);
      resolve(port);
    });
    httpServer.on('error', reject);
  });
}
