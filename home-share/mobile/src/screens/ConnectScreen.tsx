import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as api from '../api';
import { parseQrUrl } from '../api';
import { COLORS } from '../utils';
import { styles } from '../styles';

interface Props {
  onConnected: (url: string, pin: string) => void;
}

export default function ConnectScreen({ onConnected }: Props) {
  const [url, setUrl] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [pinRequired, setPinRequired] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const scannedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const savedUrl = await api.getServerUrl();
      const savedPin = await api.getPin();
      setUrl(savedUrl);
      setPin(savedPin);
      if (!savedUrl) {
        await openScanner();
      }
    })();
  }, []);

  async function connect(serverUrl?: string) {
    const target = (serverUrl || url).trim();
    if (!target) {
      Alert.alert('خطأ', 'أدخل عنوان السيرفر أو امسح QR');
      return;
    }
    const base = parseQrUrl(target);
    setLoading(true);
    try {
      const info = await api.testConnection(base);
      if (info.pinEnabled) {
        if (!pin) {
          setPinRequired(true);
          setShowManual(true);
          setLoading(false);
          Alert.alert('PIN مطلوب', 'السيرفر محمي — أدخل رمز PIN');
          return;
        }
        const valid = await api.verifyPin(base, pin);
        if (!valid) {
          Alert.alert('خطأ', 'رمز PIN غير صحيح');
          setLoading(false);
          return;
        }
      }
      await api.setServerUrl(base);
      await api.setPin(pin);
      onConnected(base, pin);
    } catch {
      Alert.alert('خطأ', 'تعذّر الاتصال.\nتأكد أن برنامج اللابتوب شغّال والجهازين على نفس Wi-Fi');
    } finally {
      setLoading(false);
    }
  }

  async function openScanner() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        setShowManual(true);
        Alert.alert('خطأ', 'نحتاج إذن الكاميرا لمسح QR');
        return;
      }
    }
    scannedRef.current = false;
    setScanning(true);
  }

  if (scanning) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView
          style={{ flex: 1 }}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={({ data }) => {
            if (scannedRef.current) return;
            scannedRef.current = true;
            setScanning(false);
            const parsed = parseQrUrl(data);
            setUrl(parsed);
            connect(parsed);
          }}
        />
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerHint}>
            وجّه الكاميرا نحو QR{'\n'}على شاشة اللابتوب (Home Share)
          </Text>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost, { marginTop: 30, paddingHorizontal: 30 }]}
            onPress={() => { setScanning(false); setShowManual(true); }}
          >
            <Text style={styles.btnText}>إدخال يدوي</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 8 }}>🏠</Text>
          <Text style={[styles.headerTitle, { textAlign: 'center', fontSize: 24, marginBottom: 4 }]}>
            Home Share
          </Text>
          <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginBottom: 24, fontSize: 14 }}>
            امسح QR من اللابتوب للربط
          </Text>

          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, { marginBottom: 16 }]}
            onPress={openScanner}
            disabled={loading}
          >
            <Text style={[styles.btnText, styles.btnTextPrimary, { fontSize: 17 }]}>
              📷 مسح QR Code
            </Text>
          </TouchableOpacity>

          {!showManual && (
            <TouchableOpacity onPress={() => setShowManual(true)} style={{ marginBottom: 16 }}>
              <Text style={{ textAlign: 'center', color: COLORS.primary, fontSize: 14 }}>
                إدخال العنوان يدوياً
              </Text>
            </TouchableOpacity>
          )}

          {showManual && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📡 عنوان السيرفر</Text>
              <TextInput
                style={styles.input}
                placeholder="http://192.168.1.10:3847"
                placeholderTextColor={COLORS.textMuted}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />

              {(pinRequired || pin) && (
                <>
                  <Text style={[styles.cardTitle, { marginTop: 8 }]}>🔒 رمز PIN</Text>
                  <TextInput
                    style={[styles.input, { textAlign: 'center', letterSpacing: 8, fontSize: 20 }]}
                    placeholder="••••"
                    placeholderTextColor={COLORS.textMuted}
                    value={pin}
                    onChangeText={setPin}
                    keyboardType="number-pad"
                    maxLength={6}
                    secureTextEntry
                  />
                </>
              )}

              <TouchableOpacity
                style={[styles.btn, styles.btnGhost, { marginTop: 8 }]}
                onPress={() => connect()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <Text style={styles.btnText}>اتصال</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <Text style={{ textAlign: 'center', color: COLORS.textMuted, fontSize: 12, marginTop: 16 }}>
            1. شغّل Home Share على اللابتوب{'\n'}
            2. امسح QR من الشاشة{'\n'}
            3. ابدأ النقل فوراً
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
