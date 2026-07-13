export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60_000) return 'الآن';
  if (diff < 3_600_000) return `منذ ${Math.floor(diff / 60_000)} د`;
  if (diff < 86_400_000) return `منذ ${Math.floor(diff / 3_600_000)} س`;
  return d.toLocaleDateString('ar', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fileIcon(mime: string): string {
  if (mime.startsWith('image/')) return '🖼️';
  if (mime.startsWith('video/')) return '🎬';
  if (mime.startsWith('audio/')) return '🎵';
  if (mime.includes('pdf')) return '📄';
  if (mime.includes('zip') || mime.includes('rar')) return '📦';
  if (mime.includes('text')) return '📝';
  return '📎';
}

export function deviceLabel(from: string): string {
  if (from === 'laptop') return '💻 اللابتوب';
  if (from === 'phone') return '📱 الموبايل';
  return from;
}

export const COLORS = {
  bg: '#0f1117',
  surface: '#1a1d27',
  surface2: '#242836',
  border: '#2e3345',
  text: '#e8eaef',
  textMuted: '#8b92a5',
  primary: '#6366f1',
  success: '#22c55e',
  danger: '#ef4444',
};
