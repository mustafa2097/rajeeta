import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { FileMeta, Message, ServerInfo, ClipboardPayload, DeviceInfo } from './types';
import * as api from './api';
import { formatBytes, formatTime, fileIcon, isImage, deviceLabel } from './utils';
import { QRCodeSVG } from 'qrcode.react';

const DEVICE_NAME = 'laptop';

function PinModal({ onSuccess }: { onSuccess: (pin: string) => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit() {
    const valid = await api.verifyPin(pin);
    if (valid) {
      sessionStorage.setItem('home-share-pin', pin);
      onSuccess(pin);
    } else {
      setError('رمز PIN غير صحيح');
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>🔒 أدخل رمز PIN</h2>
        <p>السيرفر محمي برمز PIN</p>
        <input
          className="pin-input"
          type="password"
          maxLength={6}
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="••••"
          autoFocus
        />
        {error && <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>}
        <button className="btn btn-primary" onClick={handleSubmit} style={{ width: '100%' }}>
          دخول
        </button>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: string }) {
  return <div className={`toast ${type}`}>{message}</div>;
}

export default function App() {
  const [pin, setPin] = useState<string | undefined>(
    () => sessionStorage.getItem('home-share-pin') || undefined,
  );
  const [needsPin, setNeedsPin] = useState(false);
  const [connected, setConnected] = useState(false);
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [text, setText] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [clipboardBanner, setClipboardBanner] = useState<ClipboardPayload | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState('');

  const showToast = useCallback((msg: string, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadData = useCallback(async (p?: string) => {
    try {
      const [f, m, i] = await Promise.all([
        api.getFiles(p),
        api.getMessages(p),
        api.getInfo(),
      ]);
      setFiles(f);
      setMessages(m);
      setInfo(i);
      if (i.pinEnabled && !p) setNeedsPin(true);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    loadData(pin);
  }, [pin, loadData]);

  useEffect(() => {
    const socket: Socket = io(window.location.origin, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('register', { name: 'اللابتوب', type: 'laptop' });
      setConnected(true);
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new-file', (f: FileMeta) => {
      setFiles((prev) => [f, ...prev.filter((x) => x.id !== f.id)]);
      showToast(`📥 ملف جديد: ${f.name}`, 'success');
    });

    socket.on('file-deleted', ({ id }: { id: string }) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    });

    socket.on('files-cleared', () => setFiles([]));

    socket.on('new-message', (m: Message) => {
      setMessages((prev) => [m, ...prev.filter((x) => x.id !== m.id)]);
      if (m.from !== DEVICE_NAME) showToast(`💬 رسالة من ${deviceLabel(m.from)}`, 'info');
    });

    socket.on('messages-cleared', () => setMessages([]));

    socket.on('clipboard', (payload: ClipboardPayload) => {
      if (payload.from !== DEVICE_NAME) {
        setClipboardBanner(payload);
        setTimeout(() => setClipboardBanner(null), 10000);
      }
    });

    socket.on('devices', (d: DeviceInfo[]) => setDevices(d));

    return () => { socket.disconnect(); };
  }, [showToast]);

  async function handleUpload(fileList: FileList | File[]) {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    setUploading(true);
    try {
      for (const file of arr) {
        await api.uploadFile(file, DEVICE_NAME, pin);
      }
      await loadData(pin);
      showToast(`✅ تم رفع ${arr.length} ملف`, 'success');
    } catch {
      showToast('❌ فشل الرفع', 'info');
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleUpload(e.dataTransfer.files);
  }

  async function handleSendMessage() {
    if (!text.trim()) return;
    try {
      await api.sendMessage(text, DEVICE_NAME, pin);
      setText('');
      await loadData(pin);
    } catch {
      showToast('❌ فشل الإرسال', 'info');
    }
  }

  async function handleClipboardSync() {
    try {
      const clip = await navigator.clipboard.readText();
      if (clip) {
        await api.syncClipboard(clip, DEVICE_NAME, pin);
        showToast('📋 تم إرسال الحافظة', 'success');
      }
    } catch {
      showToast('❌ لا يمكن قراءة الحافظة', 'info');
    }
  }

  async function acceptClipboard() {
    if (clipboardBanner) {
      await navigator.clipboard.writeText(clipboardBanner.text);
      showToast('📋 تم النسخ!', 'success');
      setClipboardBanner(null);
    }
  }

  const qrUrl = info?.urls?.[0] || `http://localhost:3847`;

  if (needsPin && !pin) {
    return <PinModal onSuccess={(p) => { setPin(p); setNeedsPin(false); }} />;
  }

  return (
    <div className="app">
      {clipboardBanner && (
        <div className="clipboard-banner" onClick={acceptClipboard}>
          📋 {deviceLabel(clipboardBanner.from)}: {clipboardBanner.text.slice(0, 60)}
          {clipboardBanner.text.length > 60 ? '...' : ''} — اضغط للنسخ
        </div>
      )}

      <header className="header">
        <h1><span>🏠</span> Home Share</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`status-badge ${connected ? 'online' : 'offline'}`}>
            <span className="status-dot" />
            {connected ? `متصل · ${devices.length} جهاز` : 'غير متصل'}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowSettings(!showSettings)}>
            ⚙️
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">⚙️ الإعدادات</div>
          <div className="settings-row">
            <div>
              <div className="settings-label">رمز PIN</div>
              <div className="settings-desc">حماية الوصول (4-6 أرقام)</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="chat-input"
                style={{ width: 100, textAlign: 'center', letterSpacing: 4 }}
                maxLength={6}
                placeholder="PIN"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={async () => {
                  await api.setPin(newPin || null, pin);
                  showToast(newPin ? '🔒 تم تفعيل PIN' : '🔓 تم إلغاء PIN', 'success');
                  setNewPin('');
                }}
              >
                حفظ
              </button>
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="settings-label">مسح الكل</div>
              <div className="settings-desc">حذف جميع الملفات والرسائل</div>
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={async () => {
                await api.clearFiles(pin);
                await api.clearMessages(pin);
                setFiles([]);
                setMessages([]);
                showToast('🗑️ تم المسح', 'success');
              }}
            >
              مسح الكل
            </button>
          </div>
        </div>
      )}

      <div className="grid">
        {/* Left: Files + Upload */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">
              📤 رفع ملفات
              {uploading && <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>جاري الرفع...</span>}
            </div>
            <div
              className={`dropzone ${dragging ? 'active' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <div className="dropzone-icon">📁</div>
              <p>اسحب الملفات هنا أو اضغط للاختيار</p>
              <p style={{ fontSize: '0.75rem', marginTop: 4 }}>أي نوع · حتى 1GB</p>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              📂 الملفات ({files.length})
              {files.length > 0 && (
                <button className="btn btn-danger btn-sm" onClick={async () => {
                  await api.clearFiles(pin);
                  setFiles([]);
                }}>مسح الكل</button>
              )}
            </div>
            {files.length === 0 ? (
              <div className="empty-state">لا توجد ملفات بعد</div>
            ) : (
              <div className="file-list">
                {files.map((f) => (
                  <div key={f.id} className="file-item">
                    {isImage(f.mimeType) ? (
                      <img className="file-thumb" src={api.previewUrl(f.id)} alt="" />
                    ) : (
                      <span className="file-icon">{fileIcon(f.mimeType)}</span>
                    )}
                    <div className="file-info">
                      <div className="file-name">{f.name}</div>
                      <div className="file-meta">
                        <span>{formatBytes(f.size)}</span>
                        <span>{deviceLabel(f.from)}</span>
                        <span>{formatTime(f.createdAt)}</span>
                      </div>
                    </div>
                    <div className="file-actions">
                      <a className="btn btn-ghost btn-sm" href={api.downloadUrl(f.id, pin)} download>⬇️</a>
                      <button className="btn btn-danger btn-sm" onClick={async () => {
                        await api.deleteFile(f.id, pin);
                        setFiles((prev) => prev.filter((x) => x.id !== f.id));
                      }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat + QR */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">📱 اتصال الموبايل</div>
            <div className="qr-section">
              <QRCodeSVG value={qrUrl} size={160} bgColor="#242836" fgColor="#e8eaef" />
              <p>امسح هذا الكود من تطبيق الموبايل</p>
              <div className="ip-list">
                {info?.urls?.map((url) => (
                  <div key={url} className="ip-item">
                    <span>{url}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => {
                      navigator.clipboard.writeText(url);
                      showToast('📋 تم نسخ الرابط', 'success');
                    }}>نسخ</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              💬 رسائل ونصوص
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={handleClipboardSync}>
                  📋 إرسال الحافظة
                </button>
                {messages.length > 0 && (
                  <button className="btn btn-danger btn-sm" onClick={async () => {
                    await api.clearMessages(pin);
                    setMessages([]);
                  }}>مسح</button>
                )}
              </div>
            </div>
            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="empty-state">لا توجد رسائل</div>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className="chat-msg">
                    <div className="chat-msg-header">
                      <span>{deviceLabel(m.from)}</span>
                      <span>{formatTime(m.createdAt)}</span>
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{m.text}</div>
                  </div>
                ))
              )}
            </div>
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                rows={2}
                placeholder="اكتب رسالة..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button className="btn btn-primary" onClick={handleSendMessage}>إرسال</button>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="toast-container">
          <Toast message={toast.msg} type={toast.type} />
        </div>
      )}
    </div>
  );
}
