'use client';

import { FormEvent, useState } from 'react';
import { api, ApiError } from '@/lib/api';

export default function AdminCreateAdminPage() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const update = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api('/admin/admins', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
        }),
      });
      setSuccess('تم إنشاء حساب المسؤول بنجاح');
      setForm({ fullName: '', email: '', phone: '', password: '' });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل إنشاء المسؤول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">إنشاء أدمن</h1>
      <p className="page-subtitle">إضافة مسؤول جديد لمنصة راجيتة</p>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <section className="card card-pad" style={{ maxWidth: 560 }}>
        <form onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="fullName">الاسم الكامل</label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="phone">رقم الهاتف</label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              minLength={8}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
            />
          </div>
          <button className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري الإنشاء...' : 'إنشاء المسؤول'}
          </button>
        </form>
      </section>
    </div>
  );
}
