'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { GuestGuard } from '@/components/GuestGuard';
import { doctorImages } from '@/lib/doctor-images';
import d from '@/styles/doctor.module.css';

export default function DoctorLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(identifier.trim(), password);
      if (user.role !== 'DOCTOR') {
        logout();
        setError('هذا الحساب ليس حساب طبيب');
        return;
      }
      router.replace('/doctor');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard redirectRole="DOCTOR" redirectTo="/doctor">
      <div className={d.authSplit}>
        <div className={d.authVisual}>
          <img src={doctorImages.auth} alt="" />
          <div className={d.authVisualText}>
            <h2 className={`${d.authVisualTitle} ${d.fadeUp}`}>عيادتك. ببساطة.</h2>
            <p className={`${d.authVisualLead} ${d.fadeUp} ${d.delay1}`}>
              منصة راجيتة — إدارة المواعيد والوصفات.
            </p>
          </div>
        </div>
        <div className={d.authFormSide}>
          <div className={`${d.authCard} ${d.fadeUp}`}>
            <div className={d.authBrand}>
              <img src="/logo.png" alt="راجيتة" />
              <h1>تسجيل الدخول</h1>
              <p>بوابة الطبيب — راجيتة</p>
            </div>
            {error ? <div className="alert alert-error">{error}</div> : null}
            <form onSubmit={onSubmit}>
              <div className="field">
                <label htmlFor="identifier">البريد الإلكتروني أو رقم الهاتف</label>
                <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="dr.ali@rajeeta.iq" required autoComplete="username" />
              </div>
              <div className="field">
                <label htmlFor="password">كلمة المرور</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
              <button className="btn btn-primary btn-block" disabled={loading}>
                {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
            <div className={d.authFooter}>
              ليس لديك حساب؟ <Link href="/doctor/register">سجّل الآن</Link>
              <br />
              <Link href="/">العودة للرئيسية</Link>
            </div>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
