import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { io, Socket } from 'socket.io-client';
import * as api from '../api';
import type { FileMeta, Message, ClipboardPayload } from '../types';
import { formatBytes, formatTime, fileIcon, deviceLabel, COLORS } from '../utils';
import { styles } from '../styles';

interface Props {
  serverUrl: string;
  pin: string;
  onDisconnect: () => void;
}

type Tab = 'files' | 'chat';

export default function HomeScreen({ serverUrl, pin, onDisconnect }: Props) {
  const [tab, setTab] = useState<Tab>('files');
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [clipboardBanner, setClipboardBanner] = useState<ClipboardPayload | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [f, m] = await Promise.all([
        api.getFiles(serverUrl, pin),
        api.getMessages(serverUrl, pin),
      ]);
      setFiles(f);
      setMessages(m);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, [serverUrl, pin]);

  useEffect(() => {
    loadData();
    const socket: Socket = io(serverUrl, { transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      socket.emit('register', { name: 'الموبايل', type: 'phone' });
      setConnected(true);
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('new-file', (f: FileMeta) => {
      setFiles((prev) => [f, ...prev.filter((x) => x.id !== f.id)]);
    });
    socket.on('file-deleted', ({ id }: { id: string }) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
    });
    socket.on('new-message', (m: Message) => {
      setMessages((prev) => [m, ...prev.filter((x) => x.id !== m.id)]);
    });
    socket.on('clipboard', (payload: ClipboardPayload) => {
      if (payload.from !== 'phone') setClipboardBanner(payload);
    });

    return () => { socket.disconnect(); };
  }, [serverUrl, pin, loadData]);

  async function pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const file = result.assets[0];
    setUploading(true);
    try {
      await api.uploadFile(serverUrl, file.uri, file.name, file.mimeType || 'application/octet-stream', pin);
      await loadData();
      Alert.alert('✅', 'تم رفع الملف');
    } catch {
      Alert.alert('❌', 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const name = asset.fileName || `photo_${Date.now()}.jpg`;
    setUploading(true);
    try {
      await api.uploadFile(serverUrl, asset.uri, name, asset.mimeType || 'image/jpeg', pin);
      await loadData();
      Alert.alert('✅', 'تم رفع الصورة');
    } catch {
      Alert.alert('❌', 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('خطأ', 'نحتاج إذن الكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      await api.uploadFile(serverUrl, asset.uri, `photo_${Date.now()}.jpg`, 'image/jpeg', pin);
      await loadData();
      Alert.alert('✅', 'تم رفع الصورة');
    } catch {
      Alert.alert('❌', 'فشل رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  async function downloadFile(item: FileMeta) {
    const url = api.downloadUrl(serverUrl, item.id);
    try {
      const localUri = FileSystem.documentDirectory + item.name;
      const download = await FileSystem.downloadAsync(url, localUri, {
        headers: pin ? { 'X-Pin': pin } : {},
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(download.uri);
      } else {
        Alert.alert('✅', `تم التحميل: ${item.name}`);
      }
    } catch {
      Linking.openURL(url);
    }
  }

  async function handleSendMessage() {
    if (!text.trim()) return;
    try {
      await api.sendMessage(serverUrl, text, pin);
      setText('');
      await loadData();
    } catch {
      Alert.alert('❌', 'فشل الإرسال');
    }
  }

  async function handleClipboardSync() {
    const clip = await Clipboard.getStringAsync();
    if (!clip) {
      Alert.alert('تنبيه', 'الحافظة فارغة');
      return;
    }
    try {
      await api.syncClipboard(serverUrl, clip, pin);
      Alert.alert('✅', 'تم إرسال الحافظة للابتوب');
    } catch {
      Alert.alert('❌', 'فشل الإرسال');
    }
  }

  async function acceptClipboard() {
    if (clipboardBanner) {
      await Clipboard.setStringAsync(clipboardBanner.text);
      Alert.alert('✅', 'تم النسخ للحافظة');
      setClipboardBanner(null);
    }
  }

  const renderFile = ({ item }: { item: FileMeta }) => (
    <TouchableOpacity style={styles.fileItem} onPress={() => downloadFile(item)}>
      {item.mimeType.startsWith('image/') ? (
        <Image source={{ uri: api.previewUrl(serverUrl, item.id) }} style={styles.fileThumb} />
      ) : (
        <Text style={styles.fileIcon}>{fileIcon(item.mimeType)}</Text>
      )}
      <View style={styles.fileInfo}>
        <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.fileMeta}>
          {formatBytes(item.size)} · {deviceLabel(item.from)} · {formatTime(item.createdAt)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={async () => {
          await api.deleteFile(serverUrl, item.id, pin);
          setFiles((prev) => prev.filter((f) => f.id !== item.id));
        }}
      >
        <Text style={{ color: COLORS.danger, fontSize: 18 }}>✕</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏠 Home Share</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.statusDot, { backgroundColor: connected ? COLORS.success : COLORS.danger }]} />
            <Text style={styles.statusText}>{connected ? 'متصل' : 'غير متصل'}</Text>
          </View>
          <TouchableOpacity onPress={onDisconnect}>
            <Text style={{ color: COLORS.textMuted, fontSize: 13 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {clipboardBanner && (
        <TouchableOpacity style={styles.clipboardBanner} onPress={acceptClipboard}>
          <Text style={styles.clipboardText}>
            📋 {deviceLabel(clipboardBanner.from)}: {clipboardBanner.text.slice(0, 80)}
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, tab === 'files' && styles.tabActive]}
          onPress={() => setTab('files')}
        >
          <Text style={[styles.tabText, tab === 'files' && styles.tabTextActive]}>📂 ملفات</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'chat' && styles.tabActive]}
          onPress={() => setTab('chat')}
        >
          <Text style={[styles.tabText, tab === 'chat' && styles.tabTextActive]}>💬 رسائل</Text>
        </TouchableOpacity>
      </View>

      {tab === 'files' ? (
        <View style={styles.content}>
          <View style={styles.btnRow}>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, styles.btnHalf]} onPress={pickDocument} disabled={uploading}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>📎 ملف</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGhost, styles.btnHalf]} onPress={pickImage} disabled={uploading}>
              <Text style={styles.btnText}>🖼️ صورة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnGhost, styles.btnHalf]} onPress={takePhoto} disabled={uploading}>
              <Text style={styles.btnText}>📷 تصوير</Text>
            </TouchableOpacity>
          </View>

          {uploading && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <ActivityIndicator color={COLORS.primary} />
              <Text style={{ color: COLORS.textMuted, marginTop: 8, fontSize: 13 }}>جاري الرفع...</Text>
            </View>
          )}

          <FlatList
            data={files}
            keyExtractor={(item) => item.id}
            renderItem={renderFile}
            ListEmptyComponent={<Text style={styles.empty}>لا توجد ملفات</Text>}
            refreshing={false}
            onRefresh={loadData}
          />
        </View>
      ) : (
        <View style={[styles.content, { flex: 1 }]}>
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.chatMsg}>
                <View style={styles.chatHeader}>
                  <Text style={styles.chatFrom}>{deviceLabel(item.from)}</Text>
                  <Text style={styles.chatFrom}>{formatTime(item.createdAt)}</Text>
                </View>
                <Text style={styles.chatText}>{item.text}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>لا توجد رسائل</Text>}
            style={{ flex: 1 }}
            inverted={false}
          />

          <View style={styles.chatInputRow}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost, { paddingVertical: 10, paddingHorizontal: 12 }]} onPress={handleClipboardSync}>
              <Text style={{ fontSize: 18 }}>📋</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.chatInput}
              placeholder="اكتب رسالة..."
              placeholderTextColor={COLORS.textMuted}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity style={[styles.btn, styles.btnPrimary, { paddingVertical: 10, paddingHorizontal: 16 }]} onPress={handleSendMessage}>
              <Text style={[styles.btnText, styles.btnTextPrimary]}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
