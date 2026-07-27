'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { doctorImages } from '@/lib/doctor-images';
import {
  appointmentStatusLabel,
  formatCurrency,
  formatDate,
} from '@/lib/format';
import type { Appointment, Wallet } from '@/lib/types';
import d from '@/styles/doctor.module.css';

function statusPill(status: string) {
  const map: Record<string, string> = {
    PENDING: d.pillPending,
    CONFIRMED: d.pillConfirmed,
    COMPLETED: d.pillCompleted,
    REJECTED: d.pillRejected,
    CANCELLED: d.pillCancelled,
  };
  return map[status] ?? d.pillCompleted;
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [apps, walletData] = await Promise.all([
          api<Appointment[]>('/appointments/doctor'),
          api<Wallet>('/wallet'),
        ]);
        if (!active) return;
        setAppointments(apps);
        setWallet(walletData);
      } catch (err) {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : 'تعذر تحميل البيانات');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const completed = appointments.filter((a) => a.status === 'COMPLETED');
    const pending = appointments.filter((a) => a.status === 'PENDING');
    const confirmed = appointments.filter((a) => a.status === 'CONFIRMED');
    const visitCount = completed.length;
    const totalPaid = completed.reduce((sum, a) => sum + (a.amountPaid || 0), 0);
    const totalRevenue = wallet?.totalEarnings ?? wallet?.transactions
        ?.filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0) ?? totalPaid;
    const withdrawableBalance =
      wallet?.withdrawableBalance ?? wallet?.balance ?? 0;

    const diseases = new Map<string, number>();
    for (const app of completed) {
      const condition = app.patientCondition?.trim();
      if (condition) diseases.set(condition, (diseases.get(condition) ?? 0) + 1);
      for (const disease of app.patient?.chronicDiseases ?? []) {
        diseases.set(disease, (diseases.get(disease) ?? 0) + 1);
      }
    }

    const diseasesSummary = Array.from(diseases.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const upcoming = appointments
      .filter((a) => a.status === 'CONFIRMED' || a.status === 'PENDING')
      .sort(
        (a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
      )
      .slice(0, 6);

    return {
      visitCount,
      totalPaid,
      totalRevenue,
      withdrawableBalance,
      pendingCount: pending.length,
      confirmedCount: confirmed.length,
      diseasesSummary,
      upcoming,
    };
  }, [appointments, wallet]);

  const doctorName = user?.doctorProfile?.fullName || 'دكتور';
  const specialty = user?.doctorProfile?.specialty || 'طبيب';

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          جاري تحميل لوحة التحكم...
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className={d.hero}>
        <img src={doctorImages.hero} alt="" className={d.heroImg} />
        <div className={d.heroOverlay}>
          <span className={`${d.eyebrow} ${d.fadeUp}`}>بوابة الطبيب · راجيتة</span>
          <h1 className={`${d.heroTitle} ${d.fadeUp} ${d.delay1}`}>مرحباً، {doctorName}</h1>
          <p className={`${d.heroLead} ${d.fadeUp} ${d.delay2}`}>
            {specialty} — إدارة عيادتك، مواعيدك، ومحفظتك من مكان واحد. بسيط،
            منظم، وجاهز للعمل.
          </p>
          <div className={`${d.heroActions} ${d.fadeUp} ${d.delay3}`}>
            <Link href="/doctor/appointments" className={`${d.heroBtn} ${d.heroBtnPrimary}`}>
              عرض المواعيد
            </Link>
            <Link href="/doctor/wallet" className={`${d.heroBtn} ${d.heroBtnGhost}`}>
              المحفظة
            </Link>
          </div>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className={d.statsRow}>
        <div className={`${d.statTile} ${d.delay1}`}>
          <div className={d.statLabel}>زيارات مكتملة</div>
          <div className={d.statValue}>{stats.visitCount}</div>
        </div>
        <div className={`${d.statTile} ${d.delay2}`}>
          <div className={d.statLabel}>بانتظار الموافقة</div>
          <div className={d.statValue}>{stats.pendingCount}</div>
        </div>
        <div className={`${d.statTile} ${d.delay3}`}>
          <div className={d.statLabel}>إجمالي الأرباح</div>
          <div className={d.statValue}>{formatCurrency(stats.totalRevenue)}</div>
        </div>
        <div className={`${d.statTile} ${d.delay4}`}>
          <div className={d.statLabel}>رصيد قابل للسحب</div>
          <div className={d.statValue}>{formatCurrency(stats.withdrawableBalance)}</div>
        </div>
      </div>

      <div className={d.grid2}>
        <section className={d.section}>
          <div className={d.sectionHead}>
            <h2 className={d.sectionTitle}>المواعيد القادمة</h2>
            <Link href="/doctor/appointments" className={d.sectionLink}>
              عرض الكل
            </Link>
          </div>
          <div className={d.panel}>
            {stats.upcoming.length === 0 ? (
              <div className={d.empty}>لا توجد مواعيد قادمة</div>
            ) : (
              stats.upcoming.map((app) => (
                <div key={app.id} className={d.listItem}>
                  <div className={d.listMain}>
                    <div className={d.listTitle}>
                      {app.patient?.fullName || 'مريض'}
                    </div>
                    <div className={d.listSub}>
                      {formatDate(app.scheduledAt)}
                      {app.patientCondition ? ` · ${app.patientCondition}` : ''}
                    </div>
                  </div>
                  <span className={`${d.pill} ${statusPill(app.status)}`}>
                    {appointmentStatusLabel[app.status] || app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className={d.section}>
          <div className={d.sectionHead}>
            <h2 className={d.sectionTitle}>ملخص الحالات</h2>
          </div>
          <div className={`${d.panel} ${d.panelPad}`}>
            {stats.diseasesSummary.length === 0 ? (
              <div className={d.empty}>لا توجد بيانات بعد</div>
            ) : (
              <div className={d.chipGrid}>
                {stats.diseasesSummary.map(([name, count]) => (
                  <span key={name} className={d.chip}>
                    {name}
                    <span className={d.chipCount}>{count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className={d.section}>
        <div className={d.sectionHead}>
          <h2 className={d.sectionTitle}>كل ما تحتاجه في عيادتك</h2>
        </div>
        <div className={d.editorialGrid}>
          <article className={`${d.editorialCard} ${d.delay1}`}>
            <img src={doctorImages.consultation} alt="" className={d.editorialImg} />
            <div className={d.editorialBody}>
              <h3 className={d.editorialTitle}>مواعيد منظمة</h3>
              <p className={d.editorialText}>تأكيد، رفض، وإكمال المواعيد بخطوات واضحة.</p>
            </div>
          </article>
          <article className={`${d.editorialCard} ${d.delay2}`}>
            <img src={doctorImages.technology} alt="" className={d.editorialImg} />
            <div className={d.editorialBody}>
              <h3 className={d.editorialTitle}>وصفات إلكترونية</h3>
              <p className={d.editorialText}>وصفات رقمية أو مكتوبة بخط اليد.</p>
            </div>
          </article>
          <article className={`${d.editorialCard} ${d.delay3}`}>
            <img src={doctorImages.wallet} alt="" className={d.editorialImg} />
            <div className={d.editorialBody}>
              <h3 className={d.editorialTitle}>محفظة وإيرادات</h3>
              <p className={d.editorialText}>تتبع أتعابك وسحوباتك بالدينار العراقي.</p>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
