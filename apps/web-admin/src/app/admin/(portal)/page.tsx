'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import {
  appointmentStatusLabel,
  formatCurrency,
  paymentTypeLabel,
} from '@/lib/format';
import type { AdminStats } from '@/lib/types';
import a from '@/styles/admin.module.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await api<AdminStats>('/admin/stats');
        setStats(data);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'تعذر تحميل الإحصائيات');
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
          جاري تحميل النظرة العامة...
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className={a.hero}>
        <div className={a.heroOverlay}>
          <div className={a.heroEyebrow}>لوحة الإدارة</div>
          <h1 className={a.heroTitle}>مرحباً بك في راجيتة</h1>
          <p className={a.heroLead}>
            إدارة الأطباء والمرضى والتحويلات من مكان واحد — تصميم موحّد وسريع.
          </p>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className={a.statsRow}>
        <Link href="/admin/patients" className={`${a.statTile} ${a.fadeUp}`}>
          <div className={a.statLabel}>المرضى</div>
          <div className={a.statValue}>{stats?.counts.patients ?? 0}</div>
        </Link>
        <Link href="/admin/doctors" className={`${a.statTile} ${a.fadeUp} ${a.delay1}`}>
          <div className={a.statLabel}>الأطباء</div>
          <div className={a.statValue}>{stats?.counts.doctors ?? 0}</div>
        </Link>
        <div className={`${a.statTile} ${a.fadeUp} ${a.delay2}`}>
          <div className={a.statLabel}>المسؤولون</div>
          <div className={a.statValue}>{stats?.counts.admins ?? 0}</div>
        </div>
        <div className={`${a.statTile} ${a.fadeUp} ${a.delay3}`}>
          <div className={a.statLabel}>الوصفات</div>
          <div className={a.statValue}>{stats?.counts.prescriptions ?? 0}</div>
        </div>
      </div>

      <div className={`${a.statsRow} ${a.fadeUp}`}>
        <div className={a.statTile}>
          <div className={a.statLabel}>إجمالي الإيرادات</div>
          <div className={a.statValue}>
            {formatCurrency(stats?.revenue.total ?? 0)}
          </div>
        </div>
        <div className={a.statTile}>
          <div className={a.statLabel}>إيداعات المحفظة</div>
          <div className={a.statValue}>
            {formatCurrency(stats?.revenue.walletCredits ?? 0)}
          </div>
        </div>
        <div className={a.statTile}>
          <div className={a.statLabel}>سحوبات المحفظة</div>
          <div className={a.statValue}>
            {formatCurrency(stats?.revenue.walletDebits ?? 0)}
          </div>
        </div>
      </div>

      <div className={a.grid2}>
        <section className={a.panel}>
          <div className={a.panelPad}>
            <h2 className={a.sectionTitle}>المواعيد حسب الحالة</h2>
            {Object.entries(stats?.counts.appointments ?? {}).length === 0 ? (
              <div className={a.empty}>لا توجد مواعيد</div>
            ) : (
              Object.entries(stats?.counts.appointments ?? {}).map(
                ([status, count]) => (
                  <div key={status} className={a.listItem}>
                    <span>{appointmentStatusLabel[status] || status}</span>
                    <strong>{count}</strong>
                  </div>
                ),
              )
            )}
          </div>
        </section>

        <section className={a.panel}>
          <div className={a.panelPad}>
            <h2 className={a.sectionTitle}>الإيرادات حسب النوع</h2>
            {Object.entries(stats?.revenue.byType ?? {}).length === 0 ? (
              <div className={a.empty}>لا توجد إيرادات</div>
            ) : (
              Object.entries(stats?.revenue.byType ?? {}).map(
                ([type, amount]) => (
                  <div key={type} className={a.listItem}>
                    <span>{paymentTypeLabel[type] || type}</span>
                    <strong>{formatCurrency(amount)}</strong>
                  </div>
                ),
              )
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
