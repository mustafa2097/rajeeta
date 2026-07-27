'use client';

import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import {
  formatCurrency,
  formatDate,
  paymentTypeLabel,
  walletTypeLabel,
} from '@/lib/format';
import type { AdminTransactions } from '@/lib/types';

export default function AdminTransactionsPage() {
  const [data, setData] = useState<AdminTransactions | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api<AdminTransactions>('/admin/transactions');
        setData(result);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذر تحميل التحويلات');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          جاري تحميل التحويلات...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">التحويلات</h1>
      <p className="page-subtitle">معاملات المحفظة والمدفوعات</p>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="stack">
        <section className="card card-pad">
          <h2 className="section-title">معاملات المحفظة</h2>
          {!data?.walletTransactions.length ? (
            <div className="empty-state">لا توجد معاملات محفظة</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الطبيب</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>الوصف</th>
                  </tr>
                </thead>
                <tbody>
                  {data.walletTransactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{formatDate(tx.createdAt)}</td>
                      <td>{tx.wallet?.doctor?.fullName || '—'}</td>
                      <td>{walletTypeLabel[tx.type] || tx.type}</td>
                      <td>{formatCurrency(tx.amount)}</td>
                      <td>{tx.description || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card card-pad">
          <h2 className="section-title">المدفوعات</h2>
          {!data?.payments.length ? (
            <div className="empty-state">لا توجد مدفوعات</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>المستخدم</th>
                    <th>النوع</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>المرجع</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{formatDate(payment.createdAt)}</td>
                      <td>
                        {payment.user?.doctorProfile?.fullName ||
                          payment.user?.email ||
                          '—'}
                      </td>
                      <td>{paymentTypeLabel[payment.type] || payment.type}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.status}</td>
                      <td>{payment.reference || '—'}</td>
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
