'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { GuestGuard } from '@/components/GuestGuard';
import { doctorImages } from '@/lib/doctor-images';
import d from '@/styles/doctor.module.css';

export default function DoctorRegisterPage() {
  const { registerDoctor } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [form, setForm] = useState({
    phone: '',
    password: '',
    email: '',
    fullName: '',
    age: '',
    specialty: '',
    clinicName: '',
    clinicAddress: '',
    clinicFloor: '',
    consultationFee: '',
  });

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!acceptedTerms || !acceptedPrivacy) {
      setError('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية');
      return;
    }
    setLoading(true);
    try {
      await registerDoctor({
        phone: form.phone.trim(),
        password: form.password,
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        age: Number(form.age),
        specialty: form.specialty.trim(),
        clinicName: form.clinicName.trim(),
        clinicAddress: form.clinicAddress.trim(),
        clinicFloor: form.clinicFloor.trim(),
        consultationFee: Number(form.consultationFee),
      });
      router.replace('/doctor/subscribe');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard redirectRole="DOCTOR" redirectTo="/doctor">
      <div className={d.authSplit}>
        <div className={d.authVisual}>
          <img src={doctorImages.clinic} alt="" />
          <div className={d.authVisualText}>
            <h2 className={d.authVisualTitle}>انضم إلى راجيتة.</h2>
            <p className={d.authVisualLead}>سجّل عيادتك — شهران مجاناً.</p>
          </div>
        </div>
        <div className={d.authFormSide} style={{ alignItems: 'flex-start', paddingTop: '2.5rem' }}>
          <div className={d.authCard} style={{ width: 'min(560px, 100%)' }}>
          <div className={d.authBrand}>
            <img src="/logo.png" alt="راجيتة" />
            <h1>تسجيل طبيب</h1>
            <p>أنشئ حسابك وابدأ إدارة عيادتك</p>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <form onSubmit={onSubmit}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="fullName">الاسم الكامل</label>
                <input id="fullName" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="age">العمر</label>
                <input id="age" type="number" min={1} value={form.age} onChange={(e) => update('age', e.target.value)} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="email">البريد الإلكتروني</label>
                <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="phone">رقم الهاتف</label>
                <input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="password">كلمة المرور</label>
                <input id="password" type="password" minLength={8} value={form.password} onChange={(e) => update('password', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="specialty">التخصص</label>
                <input id="specialty" value={form.specialty} onChange={(e) => update('specialty', e.target.value)} required />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="clinicName">اسم العيادة</label>
                <input id="clinicName" value={form.clinicName} onChange={(e) => update('clinicName', e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="clinicFloor">الطابق</label>
                <input id="clinicFloor" value={form.clinicFloor} onChange={(e) => update('clinicFloor', e.target.value)} required />
              </div>
            </div>
            <div className="field">
              <label htmlFor="clinicAddress">عنوان العيادة</label>
              <input id="clinicAddress" value={form.clinicAddress} onChange={(e) => update('clinicAddress', e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="consultationFee">أجرة الاستشارة (د.ع)</label>
              <input id="consultationFee" type="number" min={0} value={form.consultationFee} onChange={(e) => update('consultationFee', e.target.value)} required />
            </div>
            <div style={{ display: 'grid', gap: '0.75rem', margin: '1rem 0 1.25rem' }}>
              <label style={{ display: 'flex', gap: '0.55rem', fontSize: '0.95rem' }}>
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} />
                <span>أوافق على <Link href="/legal/terms" target="_blank" style={{ color: '#006994', fontWeight: 700 }}>شروط الاستخدام</Link></span>
              </label>
              <label style={{ display: 'flex', gap: '0.55rem', fontSize: '0.95rem' }}>
                <input type="checkbox" checked={acceptedPrivacy} onChange={(e) => setAcceptedPrivacy(e.target.checked)} />
                <span>أوافق على <Link href="/legal/privacy" target="_blank" style={{ color: '#006994', fontWeight: 700 }}>سياسة الخصوصية</Link></span>
              </label>
            </div>
            <button className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className={d.authFooter}>
            لديك حساب؟ <Link href="/doctor/login">تسجيل الدخول</Link>
          </div>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
