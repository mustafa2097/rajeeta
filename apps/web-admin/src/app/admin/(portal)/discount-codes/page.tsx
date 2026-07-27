'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { DiscountCode } from '@/lib/types';

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [code, setCode] = useState('');
  const [percentage, setPercentage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api<DiscountCode[]>('/discount-codes');
      setCodes(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل أكواد الخصم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await api('/discount-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          percentage: Number(percentage),
        }),
      });
      setCode('');
      setPercentage('');
      setSuccess('تم إنشاء كود الخصم');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل إنشاء الكود');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (id: string) => {
    setError('');
    setSuccess('');
    try {
      await api(`/discount-codes/${id}`, { method: 'PATCH' });
      setSuccess('تم تحديث حالة الكود');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل التحديث');
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          جاري تحميل أكواد الخصم...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">أكواد الخصم</h1>
      <p className="page-subtitle">إنشاء وإدارة أكواد الخصم</p>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="stack">
        <section className="card card-pad">
          <h2 className="section-title">إنشاء كود جديد</h2>
          <form onSubmit={onCreate} style={{ maxWidth: 520 }}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="code">الكود</label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="percentage">النسبة %</label>
                <input
                  id="percentage"
                  type="number"
                  min={1}
                  max={100}
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="btn btn-primary" disabled={submitting}>
              {submitting ? 'جاري الإنشاء...' : 'إنشاء الكود'}
            </button>
          </form>
        </section>

        <section className="card card-pad">
          <h2 className="section-title">الأكواد الحالية</h2>
          {!codes.length ? (
            <div className="empty-state">لا توجد أكواد خصم</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>النسبة</th>
                    <th>الحالة</th>
                    <th>مرات الاستخدام</th>
                    <th>تاريخ الإنشاء</th>
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.code}</td>
                      <td>{item.percentage}%</td>
                      <td>
                        <span
                          className={`badge ${
                            item.isActive ? 'badge-active' : 'badge-expired'
                          }`}
                        >
                          {item.isActive ? 'نشط' : 'معطّل'}
                        </span>
                      </td>
                      <td>{item.usageCount}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => void toggle(item.id)}
                        >
                          {item.isActive ? 'تعطيل' : 'تفعيل'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
