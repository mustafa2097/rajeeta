# 🏠 Home Share

مشاركة الملفات والنصوص بين **الموبايل** و**اللابتوب** عبر Wi-Fi البيت.

## التطبيقات الجاهزة

| الجهاز | الملف | كيف تبنيه |
|--------|-------|-----------|
| **Windows EXE** | `desktop/out/HomeShare-Portable.exe` | `build-exe.bat` أو `npm run build:desktop` |
| **Windows (مجلد)** | `desktop/out/win-unpacked/Home Share.exe` | نفس الأمر |
| **Android APK** | من EAS أو `mobile/android/app/build/outputs/` | `npm run build:apk` |

---

## طريقة الاستخدام (QR)

```
1. شغّل Home Share.exe على اللابتوب
2. افتح التطبيق على الموبايل
3. امسح QR Code من شاشة اللابتوب
4. ابدأ النقل — ملفات، صور، نصوص
```

---

## بناء EXE (Windows)

```powershell
cd home-share
npm install
npm run install:all
npm run build:desktop
```

الملفات في: `desktop/out/`
- **HomeShare-Portable.exe** — ملف واحد، شغّله مباشرة
- **win-unpacked/Home Share.exe** — نسخة غير مضغوطة

---

## بناء APK (Android)

### الطريقة 1 — EAS Cloud (أسهل)

```powershell
cd home-share/mobile
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

حمّل APK من رابط EAS.

### الطريقة 2 — محلي (يتطلب Android Studio)

```powershell
cd home-share/mobile
npx expo prebuild --platform android
cd android
.\gradlew assembleRelease
```

APK في: `android/app/build/outputs/apk/release/`

---

## التطوير

```powershell
# سيرفر + موقع (تطوير)
npm run dev

# تطبيق موبايل (Expo Go)
npm run dev:mobile

# برنامج سطح المكتب (تطوير)
npm run dev:desktop
```

---

## الميزات

- رفع أي ملف حتى 1GB
- رسائل نصية فورية
- مزامنة الحافظة (Clipboard)
- QR للربط السريع
- PIN اختياري
- يعمل على شبكة البيت فقط

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| الموبايل لا يتصل | نفس Wi-Fi + شغّل EXE على اللابتوب |
| QR لا يُمسح | اسمح بإذن الكاميرا |
| Firewall | EXE يضيف القاعدة تلقائياً |
| APK build فشل | `eas login` ثم أعد المحاولة |
