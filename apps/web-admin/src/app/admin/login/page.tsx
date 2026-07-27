'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { GuestGuard } from '@/components/GuestGuard';
import styles from '../../auth.module.css';

export default function AdminLoginPage() {
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
      if (user.role !== 'ADMIN') {
        logout();
        setError('هذا الحساب ليس حساب مسؤول');
        return;
      }
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard redirectRole="ADMIN" redirectTo="/admin">
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="راجيتة" className={styles.logoImg} />
          <h1>راجيتة</h1>
          <p>تسجيل دخول الإدارة</p>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="identifier">البريد الإلكتروني أو رقم الهاتف</label>
            <input
              id="identifier"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="admin@rajeeta.iq"
              required
              autoComplete="username"
            />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <span>بوابة الإدارة — راجيتة</span>
        </div>
      </div>
    </div>
    </GuestGuard>
  );
}
