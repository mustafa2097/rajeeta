import { PrismaClient, Role, SubscriptionStatus, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

function daysFromNow(base: Date, n: number, hour = 10, minute = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding Rajeeta database...');

  await prisma.walletTransaction.deleteMany();
  await prisma.medication.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.handwrittenPrescription.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.discountCode.deleteMany();
  await prisma.patientProfile.deleteMany();
  await prisma.doctorProfile.deleteMany();
  await prisma.adminProfile.deleteMany();
  await prisma.user.deleteMany();

  const adminPassword = await hashPassword('Admin@123456');
  const doctorPassword = await hashPassword('Doctor@123456');
  const patientPassword = await hashPassword('Patient@123456');

  const now = new Date();
  const trialEnds = daysFromNow(now, 14);
  const subEnds = daysFromNow(now, 30);

  const admin1 = await prisma.user.create({
    data: {
      email: 'admin@rajeeta.iq',
      phone: '07700000001',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      adminProfile: { create: { fullName: 'مصطفى محمد' } },
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      email: 'admin2@rajeeta.iq',
      phone: '07700000002',
      passwordHash: adminPassword,
      role: Role.ADMIN,
      adminProfile: { create: { fullName: 'ماجد حسين' } },
    },
  });

  const doctorsData = [
    { email: 'dr.ali@rajeeta.iq', phone: '07710000001', fullName: 'د. علي الحسيني', age: 45, specialty: 'طب باطني', rating: 4.8, clinicName: 'عيادة النور', clinicAddress: 'بغداد، الكرادة', clinicFloor: 'الطابق الثاني', consultationFee: 35000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null as Date | null, subscriptionEndsAt: subEnds },
    { email: 'dr.fatima@rajeeta.iq', phone: '07710000002', fullName: 'د. فاطمة الزهراء', age: 38, specialty: 'نساء وتوليد', rating: 4.9, clinicName: 'عيادة الأمل', clinicAddress: 'بغداد، المنصور', clinicFloor: 'الطابق الأول', consultationFee: 40000, subscriptionStatus: SubscriptionStatus.TRIAL, trialEndsAt: trialEnds, subscriptionEndsAt: null as Date | null },
    { email: 'dr.hassan@rajeeta.iq', phone: '07710000003', fullName: 'د. حسن الجبوري', age: 52, specialty: 'قلب وأوعية دموية', rating: 4.7, clinicName: 'مركز القلب', clinicAddress: 'بغداد، الجادرية', clinicFloor: 'الطابق الثالث', consultationFee: 50000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.noor@rajeeta.iq', phone: '07710000004', fullName: 'د. نور الساعدي', age: 34, specialty: 'جلدية', rating: 4.5, clinicName: 'عيادة البشرة', clinicAddress: 'بغداد، زيونة', clinicFloor: 'الطابق الأرضي', consultationFee: 30000, subscriptionStatus: SubscriptionStatus.TRIAL, trialEndsAt: trialEnds, subscriptionEndsAt: null },
    { email: 'dr.omar@rajeeta.iq', phone: '07710000005', fullName: 'د. عمر الشمري', age: 41, specialty: 'عظام', rating: 4.6, clinicName: 'عيادة العظام المتقدمة', clinicAddress: 'بغداد، الأعظمية', clinicFloor: 'الطابق الثاني', consultationFee: 45000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.layla@rajeeta.iq', phone: '07710000006', fullName: 'د. ليلى الموسوي', age: 36, specialty: 'أطفال', rating: 4.9, clinicName: 'عيادة الأطفال السعداء', clinicAddress: 'بغداد، الكاظمية', clinicFloor: 'الطابق الأول', consultationFee: 25000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.karim@rajeeta.iq', phone: '07710000007', fullName: 'د. كريم الدليمي', age: 48, specialty: 'أنف وأذن وحنجرة', rating: 4.4, clinicName: 'عيادة السمع', clinicAddress: 'بغداد، الدورة', clinicFloor: 'الطابق الثاني', consultationFee: 32000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.rana@rajeeta.iq', phone: '07710000008', fullName: 'د. رنا الخفاجي', age: 39, specialty: 'غدد صماء وسكري', rating: 4.7, clinicName: 'مركز السكري', clinicAddress: 'بغداد، الحارثية', clinicFloor: 'الطابق الثالث', consultationFee: 38000, subscriptionStatus: SubscriptionStatus.TRIAL, trialEndsAt: trialEnds, subscriptionEndsAt: null },
    { email: 'dr.sami@rajeeta.iq', phone: '07710000009', fullName: 'د. سامي العبيدي', age: 44, specialty: 'طب باطني', rating: 4.3, clinicName: 'عيادة الشفاء', clinicAddress: 'بغداد، البياع', clinicFloor: 'الطابق الأول', consultationFee: 28000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.dina@rajeeta.iq', phone: '07710000010', fullName: 'د. دينا الراوي', age: 37, specialty: 'نساء وتوليد', rating: 4.8, clinicName: 'مستشفى الحياة', clinicAddress: 'بغداد، الشعلة', clinicFloor: 'الطابق الثاني', consultationFee: 42000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.tariq@rajeeta.iq', phone: '07710000011', fullName: 'د. طارق النجفي', age: 50, specialty: 'قلب وأوعية دموية', rating: 4.6, clinicName: 'مركز الصحة القلبية', clinicAddress: 'بغداد، الرصافة', clinicFloor: 'الطابق الرابع', consultationFee: 55000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.sara@rajeeta.iq', phone: '07710000012', fullName: 'د. سارة العزاوي', age: 32, specialty: 'جلدية', rating: 4.5, clinicName: 'عيادة الجمال الطبي', clinicAddress: 'بغداد، الكرادة داخل', clinicFloor: 'الطابق الأرضي', consultationFee: 35000, subscriptionStatus: SubscriptionStatus.TRIAL, trialEndsAt: trialEnds, subscriptionEndsAt: null },
    { email: 'dr.majid@rajeeta.iq', phone: '07710000013', fullName: 'د. ماجد الكعبي', age: 46, specialty: 'عظام', rating: 4.7, clinicName: 'عيادة المفاصل', clinicAddress: 'بغداد، الغزالية', clinicFloor: 'الطابق الثاني', consultationFee: 48000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.huda@rajeeta.iq', phone: '07710000014', fullName: 'د. هدى السعدون', age: 40, specialty: 'أطفال', rating: 4.9, clinicName: 'عيادة الصغار', clinicAddress: 'بغداد، السيدية', clinicFloor: 'الطابق الأول', consultationFee: 27000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
    { email: 'dr.waleed@rajeeta.iq', phone: '07710000015', fullName: 'د. وليد الحيالي', age: 43, specialty: 'أنف وأذن وحنجرة', rating: 4.2, clinicName: 'عيادة الأنف والأذن', clinicAddress: 'بغداد، الشعب', clinicFloor: 'الطابق الثالث', consultationFee: 33000, subscriptionStatus: SubscriptionStatus.NONE, trialEndsAt: null, subscriptionEndsAt: null },
    { email: 'dr.amal@rajeeta.iq', phone: '07710000016', fullName: 'د. أمل البياتي', age: 35, specialty: 'غدد صماء وسكري', rating: 4.8, clinicName: 'مركز الغدد', clinicAddress: 'بغداد، المشتل', clinicFloor: 'الطابق الثاني', consultationFee: 36000, subscriptionStatus: SubscriptionStatus.ACTIVE, trialEndsAt: null, subscriptionEndsAt: subEnds },
  ];

  const doctors: Array<{ userId: string; profileId: string; fee: number; walletId: string; specialty: string }> = [];

  for (const d of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: d.email,
        phone: d.phone,
        passwordHash: doctorPassword,
        role: Role.DOCTOR,
        doctorProfile: {
          create: {
            fullName: d.fullName,
            age: d.age,
            specialty: d.specialty,
            rating: d.rating,
            clinicName: d.clinicName,
            clinicAddress: d.clinicAddress,
            clinicFloor: d.clinicFloor,
            consultationFee: d.consultationFee,
            subscriptionStatus: d.subscriptionStatus,
            trialEndsAt: d.trialEndsAt,
            subscriptionEndsAt: d.subscriptionEndsAt,
            wallet: { create: { balance: d.subscriptionStatus === SubscriptionStatus.NONE ? 0 : 200000 } },
            availabilitySlots: {
              create: [0, 1, 2, 3, 4].map((dayOfWeek) => ({
                dayOfWeek,
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true,
              })),
            },
          },
        },
      },
      include: { doctorProfile: { include: { wallet: true } } },
    });

    doctors.push({
      userId: user.id,
      profileId: user.doctorProfile!.id,
      fee: d.consultationFee,
      walletId: user.doctorProfile!.wallet!.id,
      specialty: d.specialty,
    });
  }

  const patientsData = [
    { email: 'patient1@rajeeta.iq', phone: '07720000001', fullName: 'محمد عبد الله', age: 42, bloodType: 'A+', chronicDiseases: ['سكري النوع الثاني', 'ارتفاع ضغط الدم'], labResults: { glucose: 145, hba1c: 7.2, cholesterol: 210, date: '2026-06-15' } },
    { email: 'patient2@rajeeta.iq', phone: '07720000002', fullName: 'زينب حسين', age: 29, bloodType: 'O+', chronicDiseases: ['ربو'], labResults: { spo2: 97, peakFlow: 380, date: '2026-06-20' } },
    { email: 'patient3@rajeeta.iq', phone: '07720000003', fullName: 'يوسف كريم', age: 55, bloodType: 'B+', chronicDiseases: ['أمراض القلب', 'ارتفاع الكوليسترول'], labResults: { ldl: 160, hdl: 38, triglycerides: 220, date: '2026-06-10' } },
    { email: 'patient4@rajeeta.iq', phone: '07720000004', fullName: 'هدى جاسم', age: 33, bloodType: 'AB-', chronicDiseases: [], labResults: { hemoglobin: 12.5, wbc: 6500, date: '2026-06-25' } },
    { email: 'patient5@rajeeta.iq', phone: '07720000005', fullName: 'أحمد فاضل', age: 38, bloodType: 'A-', chronicDiseases: ['حساسية موسمية'], labResults: { ige: 280, date: '2026-06-18' } },
    { email: 'patient6@rajeeta.iq', phone: '07720000006', fullName: 'نور الهدى محمود', age: 26, bloodType: 'O-', chronicDiseases: [], labResults: { hemoglobin: 13.1, date: '2026-06-22' } },
    { email: 'patient7@rajeeta.iq', phone: '07720000007', fullName: 'علي رزاق', age: 61, bloodType: 'B-', chronicDiseases: ['سكري', 'فشل كلوي مبكر'], labResults: { creatinine: 1.8, egfr: 52, date: '2026-06-12' } },
    { email: 'patient8@rajeeta.iq', phone: '07720000008', fullName: 'سارة عدنان', age: 31, bloodType: 'AB+', chronicDiseases: ['أنيميا'], labResults: { hemoglobin: 10.2, ferritin: 18, date: '2026-06-28' } },
    { email: 'patient9@rajeeta.iq', phone: '07720000009', fullName: 'حسين طلال', age: 47, bloodType: 'A+', chronicDiseases: ['ارتفاع ضغط الدم'], labResults: { bp: '150/95', date: '2026-06-08' } },
    { email: 'patient10@rajeeta.iq', phone: '07720000010', fullName: 'رغد سعد', age: 24, bloodType: 'O+', chronicDiseases: [], labResults: { vitaminD: 22, date: '2026-06-30' } },
    { email: 'patient11@rajeeta.iq', phone: '07720000011', fullName: 'كاظم ناصر', age: 52, bloodType: 'B+', chronicDiseases: ['التهاب مفاصل'], labResults: { crp: 12, esr: 28, date: '2026-06-05' } },
    { email: 'patient12@rajeeta.iq', phone: '07720000012', fullName: 'مريم خليل', age: 35, bloodType: 'A+', chronicDiseases: ['صداع نصفي'], labResults: { mri: 'طبيعي', date: '2026-06-14' } },
    { email: 'patient13@rajeeta.iq', phone: '07720000013', fullName: 'عبد الرحمن صالح', age: 19, bloodType: 'O+', chronicDiseases: [], labResults: { date: '2026-07-01' } },
    { email: 'patient14@rajeeta.iq', phone: '07720000014', fullName: 'لجين عادل', age: 8, bloodType: 'A+', chronicDiseases: ['ربو خفيف'], labResults: { peakFlow: 320, date: '2026-06-19' } },
    { email: 'patient15@rajeeta.iq', phone: '07720000015', fullName: 'فاطمة إبراهيم', age: 67, bloodType: 'B+', chronicDiseases: ['سكري', 'هشاشة عظام'], labResults: { hba1c: 8.1, dexa: 'هشاشة خفيفة', date: '2026-06-11' } },
  ];

  const patients: Array<{ profileId: string; name: string }> = [];

  for (const p of patientsData) {
    const user = await prisma.user.create({
      data: {
        email: p.email,
        phone: p.phone,
        passwordHash: patientPassword,
        role: Role.PATIENT,
        patientProfile: {
          create: {
            fullName: p.fullName,
            age: p.age,
            bloodType: p.bloodType,
            chronicDiseases: p.chronicDiseases,
            labResults: p.labResults,
          },
        },
      },
      include: { patientProfile: true },
    });
    patients.push({ profileId: user.patientProfile!.id, name: p.fullName });
  }

  const code10 = await prisma.discountCode.create({
    data: { code: 'RAJEETA10', percentage: 10, isActive: true, createdById: admin1.id, usageCount: 3 },
  });

  const code20 = await prisma.discountCode.create({
    data: { code: 'RAJEETA20', percentage: 20, isActive: true, createdById: admin1.id, usageCount: 1 },
  });

  const code15 = await prisma.discountCode.create({
    data: { code: 'WELCOME15', percentage: 15, isActive: true, createdById: admin2.id, usageCount: 0 },
  });

  type ApptSeed = {
    patientIdx: number;
    doctorIdx: number;
    dayOffset: number;
    hour: number;
    minute?: number;
    status: AppointmentStatus;
    condition?: string;
    notes?: string;
    rejectionMessage?: string;
    discountCodeId?: string;
    discountPct?: number;
    paid?: boolean;
  };

  const appointmentsPlan: ApptSeed[] = [
    // مكتملة — الأسبوع الماضي
    { patientIdx: 0, doctorIdx: 0, dayOffset: -14, hour: 9, status: AppointmentStatus.COMPLETED, condition: 'متابعة سكري', notes: 'ضبط جرعة الأنسولين', discountCodeId: code10.id, discountPct: 10, paid: true },
    { patientIdx: 2, doctorIdx: 2, dayOffset: -12, hour: 11, status: AppointmentStatus.COMPLETED, condition: 'ألم صدر عند المجهود', notes: 'تخطيط قلب طبيعي', paid: true },
    { patientIdx: 6, doctorIdx: 0, dayOffset: -10, hour: 10, status: AppointmentStatus.COMPLETED, condition: 'فحص وظائف كلى', paid: true },
    { patientIdx: 8, doctorIdx: 2, dayOffset: -9, hour: 14, status: AppointmentStatus.COMPLETED, condition: 'ضغط مرتفع', discountCodeId: code20.id, discountPct: 20, paid: true },
    { patientIdx: 1, doctorIdx: 1, dayOffset: -8, hour: 10, status: AppointmentStatus.COMPLETED, condition: 'متابعة حمل', notes: 'الأسبوع 24', paid: true },
    { patientIdx: 10, doctorIdx: 4, dayOffset: -7, hour: 15, status: AppointmentStatus.COMPLETED, condition: 'ألم ركبة يمين', paid: true },
    { patientIdx: 13, doctorIdx: 5, dayOffset: -6, hour: 9, status: AppointmentStatus.COMPLETED, condition: 'سعال وحرارة', paid: true },
    { patientIdx: 4, doctorIdx: 3, dayOffset: -5, hour: 11, status: AppointmentStatus.COMPLETED, condition: 'طفح جلدي', paid: true },
    { patientIdx: 14, doctorIdx: 7, dayOffset: -4, hour: 10, status: AppointmentStatus.COMPLETED, condition: 'متابعة سكري وغدد', paid: true },
    { patientIdx: 11, doctorIdx: 6, dayOffset: -3, hour: 13, status: AppointmentStatus.COMPLETED, condition: 'التهاب أذن', paid: true },
    { patientIdx: 0, doctorIdx: 0, dayOffset: -2, hour: 10, status: AppointmentStatus.COMPLETED, condition: 'متابعة دورية', discountCodeId: code10.id, discountPct: 10, paid: true },
    { patientIdx: 9, doctorIdx: 11, dayOffset: -1, hour: 16, status: AppointmentStatus.COMPLETED, condition: 'حب شباب', paid: true },

    // اليوم والقادم — مؤكدة
    { patientIdx: 3, doctorIdx: 3, dayOffset: 0, hour: 11, status: AppointmentStatus.CONFIRMED, condition: 'فحص بشرة دوري', paid: true },
    { patientIdx: 2, doctorIdx: 2, dayOffset: 1, hour: 14, status: AppointmentStatus.CONFIRMED, condition: 'متابعة قلب', paid: true },
    { patientIdx: 5, doctorIdx: 1, dayOffset: 2, hour: 10, status: AppointmentStatus.CONFIRMED, condition: 'فحص ما قبل الزواج', paid: true },
    { patientIdx: 7, doctorIdx: 7, dayOffset: 2, hour: 15, status: AppointmentStatus.CONFIRMED, condition: 'فحص غدة درقية', paid: true },
    { patientIdx: 12, doctorIdx: 5, dayOffset: 3, hour: 9, status: AppointmentStatus.CONFIRMED, condition: 'فحص عام', paid: true },
    { patientIdx: 10, doctorIdx: 12, dayOffset: 4, hour: 11, status: AppointmentStatus.CONFIRMED, condition: 'ألم ظهر', paid: true },
    { patientIdx: 1, doctorIdx: 9, dayOffset: 5, hour: 10, status: AppointmentStatus.CONFIRMED, condition: 'متابعة حمل', paid: true },
    { patientIdx: 6, doctorIdx: 8, dayOffset: 6, hour: 13, status: AppointmentStatus.CONFIRMED, condition: 'فحص باطني', paid: true },
    { patientIdx: 8, doctorIdx: 10, dayOffset: 7, hour: 9, status: AppointmentStatus.CONFIRMED, condition: 'تخطيط قلب', paid: true },
    { patientIdx: 14, doctorIdx: 15, dayOffset: 8, hour: 10, status: AppointmentStatus.CONFIRMED, condition: 'متابعة سكري', paid: true },

    // بانتظار الموافقة
    { patientIdx: 4, doctorIdx: 0, dayOffset: 1, hour: 9, status: AppointmentStatus.PENDING, condition: 'صداع متكرر' },
    { patientIdx: 9, doctorIdx: 11, dayOffset: 2, hour: 14, status: AppointmentStatus.PENDING, condition: 'حساسية جلدية' },
    { patientIdx: 11, doctorIdx: 4, dayOffset: 3, hour: 10, status: AppointmentStatus.PENDING, condition: 'ألم مفصل' },
    { patientIdx: 13, doctorIdx: 5, dayOffset: 4, hour: 11, status: AppointmentStatus.PENDING, condition: 'حمى وسعال' },
    { patientIdx: 5, doctorIdx: 6, dayOffset: 5, hour: 15, status: AppointmentStatus.PENDING, condition: 'التهاب حلق' },
    { patientIdx: 7, doctorIdx: 3, dayOffset: 6, hour: 10, status: AppointmentStatus.PENDING, condition: 'أكزيما' },

    // مرفوضة
    { patientIdx: 3, doctorIdx: 1, dayOffset: -1, hour: 9, status: AppointmentStatus.REJECTED, condition: 'طلب موعد عاجل', rejectionMessage: 'الطبيبة في إجازة، يرجى اختيار موعد آخر' },
    { patientIdx: 12, doctorIdx: 2, dayOffset: 0, hour: 8, status: AppointmentStatus.REJECTED, condition: 'ألم صدر', rejectionMessage: 'الموعد خارج ساعات العمل' },

    // ملغاة
    { patientIdx: 0, doctorIdx: 4, dayOffset: 3, hour: 15, status: AppointmentStatus.CANCELLED, notes: 'ألغى المريض الموعد' },
    { patientIdx: 8, doctorIdx: 13, dayOffset: 5, hour: 12, status: AppointmentStatus.CANCELLED, notes: 'تعارض مع موعد آخر' },
  ];

  const completedAppointments: Array<{ id: string; doctorWalletId: string; netPaid: number; doctorIdx: number }> = [];

  for (const a of appointmentsPlan) {
    const doctor = doctors[a.doctorIdx];
    const patient = patients[a.patientIdx];
    const fee = doctor.fee;
    const discountAmount = a.discountPct ? Math.round(fee * (a.discountPct / 100)) : 0;
    const amountPaid =
      a.status === AppointmentStatus.COMPLETED || a.paid
        ? fee - discountAmount
        : 0;

    const appt = await prisma.appointment.create({
      data: {
        patientId: patient.profileId,
        doctorId: doctor.profileId,
        scheduledAt: daysFromNow(now, a.dayOffset, a.hour, a.minute ?? 0),
        status: a.status,
        consultationFee: fee,
        discountAmount,
        amountPaid,
        discountCodeId: a.discountCodeId ?? null,
        notes: a.notes ?? null,
        patientCondition: a.condition ?? null,
        rejectionMessage: a.rejectionMessage ?? null,
      },
    });

    if (a.status === AppointmentStatus.COMPLETED) {
      completedAppointments.push({
        id: appt.id,
        doctorWalletId: doctor.walletId,
        netPaid: amountPaid,
        doctorIdx: a.doctorIdx,
      });

      await prisma.walletTransaction.create({
        data: {
          walletId: doctor.walletId,
          amount: amountPaid,
          type: 'CONSULTATION',
          description: `أتعاب استشارة — ${patient.name}`,
          appointmentId: appt.id,
        },
      });

      if (discountAmount > 0 && a.discountCodeId) {
        await prisma.walletTransaction.create({
          data: {
            walletId: doctor.walletId,
            amount: discountAmount,
            type: 'DISCOUNT_CREDIT',
            description: 'تعويض خصم',
            appointmentId: appt.id,
            discountCodeId: a.discountCodeId,
          },
        });
      }
    }
  }

  const prescriptionTemplates = [
    {
      meds: [
        { name: 'ميتفورمين', dosage: '500 مجم', instructions: 'حبة مرتين يومياً بعد الأكل', isRestricted: false },
        { name: 'أملوديبين', dosage: '5 مجم', instructions: 'حبة واحدة صباحاً', isRestricted: false },
      ],
      notes: 'متابعة بعد أسبوعين',
    },
    {
      meds: [
        { name: 'أسبرين', dosage: '81 مجم', instructions: 'حبة يومياً', isRestricted: false },
        { name: 'أتورفاستاتين', dosage: '20 مجم', instructions: 'حبة مساءً', isRestricted: true },
      ],
      notes: 'تجنب المجهود الشديد لمدة أسبوع',
    },
    {
      meds: [
        { name: 'أموكسيسيلين', dosage: '500 مجم', instructions: 'كل 8 ساعات لمدة 5 أيام', isRestricted: false },
        { name: 'باراسيتامول', dosage: '500 مجم', instructions: 'عند الحاجة للحمى', isRestricted: false },
      ],
      notes: 'إكمال الجرعة كاملة',
    },
    {
      meds: [
        { name: 'سالبيوتامول', dosage: 'بخاخ', instructions: 'عند ضيق التنفس', isRestricted: false },
      ],
      notes: 'مراجعة بعد 3 أيام إن استمر السعال',
    },
    {
      meds: [
        { name: 'حمض الفوليك', dosage: '5 مجم', instructions: 'حبة يومياً', isRestricted: false },
        { name: 'حديد', dosage: '200 مجم', instructions: 'حبة قبل النوم', isRestricted: false },
      ],
      notes: 'إعادة فحص الدم بعد شهر',
    },
  ];

  for (let i = 0; i < completedAppointments.length; i++) {
    const ca = completedAppointments[i];
    const tpl = prescriptionTemplates[i % prescriptionTemplates.length];
    const patientIdx = appointmentsPlan.filter((x) => x.status === AppointmentStatus.COMPLETED)[i]?.patientIdx ?? 0;

    await prisma.prescription.create({
      data: {
        appointmentId: ca.id,
        patientId: patients[patientIdx].profileId,
        doctorId: doctors[ca.doctorIdx].profileId,
        notes: tpl.notes,
        medications: { create: tpl.meds },
      },
    });
  }

  await prisma.handwrittenPrescription.createMany({
    data: [
      { patientId: patients[0].profileId, doctorId: doctors[0].profileId, imageUrl: '/uploads/sample-handwritten-rx.jpg', notes: 'وصفة خطية — متابعة سكري' },
      { patientId: patients[2].profileId, doctorId: doctors[2].profileId, imageUrl: '/uploads/sample-handwritten-rx.jpg', notes: 'وصفة قلب' },
      { patientId: patients[10].profileId, doctorId: doctors[4].profileId, imageUrl: '/uploads/sample-handwritten-rx.jpg', notes: 'وصفة عظام' },
    ],
  });

  for (const doc of doctors.filter((_, i) => i % 3 === 0)) {
    await prisma.payment.create({
      data: {
        userId: doc.userId,
        amount: 35000,
        type: 'SUBSCRIPTION',
        status: 'SUCCESS',
        reference: `SUB-${doc.profileId.slice(-6)}`,
      },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin1.id,
      action: 'SEED',
      entity: 'Database',
      metadata: {
        doctors: doctors.length,
        patients: patients.length,
        appointments: appointmentsPlan.length,
        completed: completedAppointments.length,
      },
      ip: '127.0.0.1',
    },
  });

  console.log('Seed completed successfully:');
  console.log(`  Admins: 2`);
  console.log(`  Doctors: ${doctors.length}`);
  console.log(`  Patients: ${patients.length}`);
  console.log(`  Appointments: ${appointmentsPlan.length} (${completedAppointments.length} completed)`);
  console.log(`  Discount codes: RAJEETA10, RAJEETA20, WELCOME15`);
  console.log('  Passwords: Admin@123456 / Doctor@123456 / Patient@123456');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
