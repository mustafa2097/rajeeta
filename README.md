# راجيتة (Rajeeta)

منصة طبية متكاملة: تطبيق للمريض (Flutter)، موقع للطبيب، وداشبورد للأدمن.

## المكونات

| الجزء | التقنية | المنفذ |
|--------|---------|--------|
| API | NestJS + Prisma + PostgreSQL | `3001` |
| موقع الطبيب + الأدمن | Next.js | `3000` |
| تطبيق المريض | Flutter | — |

## المتطلبات

- Node.js 20+
- Docker Desktop (لـ PostgreSQL)
- Flutter SDK (لتطبيق المريض)
- Git

## التشغيل السريع (Localhost)

```powershell
cd C:\Users\Mustafa_New\Projects\rajeeta

# تشغيل قاعدة البيانات
npm run db:up

# تثبيت الاعتماديات (مرة واحدة)
npm install

# ترحيل وبيانات تجريبية (مرة واحدة، أو بعد إعادة ضبط القاعدة)
npm run db:migrate
npm run db:seed

# تشغيل API + الويب معاً
npm run dev
```

- API: http://localhost:3001/api/health
- موقع الطبيب/الأدمن: http://localhost:3000

أو بشكل منفصل:

```powershell
npm run dev:api
npm run dev:web
```

## حسابات التجربة (Seed)

| الدور | البريد | الهاتف | كلمة المرور |
|-------|--------|--------|-------------|
| أدمن 1 | `admin@rajeeta.iq` | `07700000001` | `Admin@123456` |
| أدمن 2 | `admin2@rajeeta.iq` | `07700000002` | `Admin@123456` |
| طبيب (مشترك) | `dr.ali@rajeeta.iq` | `07710000001` | `Doctor@123456` |
| طبيب | `dr.fatima@rajeeta.iq` | `07710000002` | `Doctor@123456` |
| مريض | `patient1@rajeeta.iq` | `07720000001` | `Patient@123456` |

أطباء إضافيون: `dr.hassan`, `dr.noor`, `dr.omar`, `dr.layla`, `dr.karim`, `dr.rana` — نفس كلمة مرور الأطباء.

أكواد خصم جاهزة: `RAJEETA10` (10%) و `RAJEETA20` (20%).

> غيّر كلمات مرور الأدمن فوراً قبل أي نشر حقيقي.

## الروابط في الواجهة

| الصفحة | الرابط |
|--------|--------|
| الصفحة الرئيسية | http://localhost:3000 |
| دخول الطبيب | http://localhost:3000/doctor/login |
| تسجيل طبيب | http://localhost:3000/doctor/register |
| دخول الأدمن | http://localhost:3000/admin/login |

## تطبيق المريض (Flutter)

```powershell
$env:PATH = "C:\flutter_windows_3.44.2-stable\flutter\bin;" + $env:PATH
cd apps\patient
flutter pub get
```

### محاكي أندرويد

الافتراضي يتصل بـ `10.0.2.2:3001` (يعادل localhost على الجهاز المضيف):

```powershell
flutter run
```

### هاتف حقيقي عبر هوت سبوت

1. شغّل الهوت سبوت من التليفون وصل اللابتوب عليه.
2. تأكد أن الـ API يعمل ويستمع على `0.0.0.0:3001`.
3. اعرف IP اللابتوب على شبكة الهوت سبوت:

```powershell
ipconfig
```

ابحث عن عنوان IPv4 لواجهة الـ Wi-Fi / الهوت سبوت (مثال: `192.168.43.100` أو `192.168.137.1`).

4. شغّل التطبيق مع ذلك الـ IP:

```powershell
flutter run --dart-define=API_HOST=192.168.43.100
```

الإعداد موجود في [`apps/patient/lib/config/api_config.dart`](apps/patient/lib/config/api_config.dart).

> على Windows قد تحتاج تفعيل Developer Mode لدعم الـ symlinks: `start ms-settings:developers`

## الاشتراك والدفع (وهمي حالياً)

- تسجيل الطبيب يمنحه **شهرين تجريبيين مجاناً** (`TRIAL`).
- بعدها الاشتراك الشهري: **35,000 د.ع** عبر بوابة دفع وهمية.
- سحب رصيد المحفظة وهمي أيضاً — لا تُخزَّن أرقام بطاقات.

## أكواد الخصم

الأدمن ينشئ كوداً بنسبة مئوية. عند حجز الموعد:

- المريض يدفع المبلغ بعد الخصم.
- فرق الخصم يُضاف لرصيد محفظة الطبيب (`DISCOUNT_CREDIT`).

## الأمان (البروتوتايب)

- كلمات المرور: bcrypt (تكلفة 12)
- JWT قصير العمر + refresh token
- صلاحيات حسب الدور (PATIENT / DOCTOR / ADMIN)
- ValidationPipe + Helmet + Rate limiting + CORS مقيّد
- Prisma (استعلامات معلّمة)
- سجل تدقيق (AuditLog) للعمليات المالية
- رفع صور الراجيتة: نوع وحجم محدودان

## هيكل المشروع

```
rajeeta/
├── apps/
│   ├── api/       # NestJS API
│   ├── web/       # Next.js (طبيب + أدمن)
│   └── patient/   # Flutter (مريض)
├── docker-compose.yml
├── package.json
└── README.md
```

## لاحقاً عند الرفع الحقيقي

- ربط موديل الذكاء الاصطناعي المدرّب (الواجهة جاهزة عبر `/api/ai/suggest-doctors`)
- API بوابة الدفع الحقيقية
- نطاق + شهادة SSL
- تغيير كل الأسرار في `.env` وكلمات مرور الأدمن
