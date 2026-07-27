'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/Modal';
import { api, ApiError } from '@/lib/api';
import { doctorImages } from '@/lib/doctor-images';
import {
  appointmentStatusLabel,
  formatCurrency,
  formatDate,
  paymentMethodLabel,
} from '@/lib/format';
import type { Appointment, Medication } from '@/lib/types';
import d from '@/styles/doctor.module.css';

const emptyMed = (): Medication => ({
  name: '',
  dosage: '',
  instructions: '',
  isRestricted: false,
});

const filters = [
  { key: 'ALL', label: 'الكل' },
  { key: 'PENDING', label: 'بانتظار' },
  { key: 'CONFIRMED', label: 'مؤكدة' },
  { key: 'COMPLETED', label: 'مكتملة' },
  { key: 'REJECTED', label: 'مرفوضة' },
  { key: 'CANCELLED', label: 'ملغاة' },
] as const;

type FilterKey = (typeof filters)[number]['key'];

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

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');

  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState('');

  const [completeId, setCompleteId] = useState<string | null>(null);
  const [patientCondition, setPatientCondition] = useState('');

  const [rxAppointment, setRxAppointment] = useState<Appointment | null>(null);
  const [medications, setMedications] = useState<Medication[]>([emptyMed()]);
  const [rxNotes, setRxNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api<Appointment[]>('/appointments/doctor');
      setAppointments(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل المواعيد');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (activeFilter === 'ALL') return appointments;
    return appointments.filter((a) => a.status === activeFilter);
  }, [appointments, activeFilter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: appointments.length };
    for (const a of appointments) {
      map[a.status] = (map[a.status] ?? 0) + 1;
    }
    return map;
  }, [appointments]);

  const confirmAppointment = async (id: string) => {
    setBusyId(id);
    setSuccess('');
    try {
      await api(`/appointments/${id}/confirm`, { method: 'PATCH' });
      setSuccess('تم تأكيد الموعد');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل التأكيد');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectMessage.trim()) return;
    setBusyId(rejectId);
    try {
      await api(`/appointments/${rejectId}/reject`, {
        method: 'PATCH',
        body: JSON.stringify({ message: rejectMessage.trim() }),
      });
      setRejectId(null);
      setRejectMessage('');
      setSuccess('تم رفض الموعد');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل الرفض');
    } finally {
      setBusyId(null);
    }
  };

  const submitComplete = async (e: FormEvent) => {
    e.preventDefault();
    if (!completeId) return;
    setBusyId(completeId);
    try {
      await api(`/appointments/${completeId}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          patientCondition: patientCondition.trim() || undefined,
        }),
      });
      setCompleteId(null);
      setPatientCondition('');
      setSuccess('تم إكمال الموعد');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل الإكمال');
    } finally {
      setBusyId(null);
    }
  };

  const submitPrescription = async (e: FormEvent) => {
    e.preventDefault();
    if (!rxAppointment) return;
    setBusyId(rxAppointment.id);
    try {
      await api('/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: rxAppointment.id,
          notes: rxNotes.trim() || undefined,
          medications: medications.map((m) => ({
            name: m.name.trim(),
            dosage: m.dosage.trim(),
            instructions: m.instructions?.trim() || undefined,
            isRestricted: Boolean(m.isRestricted),
          })),
        }),
      });
      setRxAppointment(null);
      setMedications([emptyMed()]);
      setRxNotes('');
      setSuccess('تم إنشاء الوصفة الإلكترونية');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل إنشاء الوصفة');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          جاري تحميل المواعيد...
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className={d.hero} style={{ minHeight: 200, marginBottom: '1.5rem' }}>
        <img src={doctorImages.patients} alt="" className={d.heroImg} />
        <div className={d.heroOverlay}>
          <span className={d.eyebrow}>إدارة المواعيد</span>
          <h1 className={d.heroTitle} style={{ fontSize: '2rem' }}>
            مواعيدك
          </h1>
          <p className={d.heroLead}>
            {appointments.length} موعد · {counts.PENDING ?? 0} بانتظار الموافقة
          </p>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className={d.filterRow}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${d.filterBtn} ${activeFilter === f.key ? d.filterBtnActive : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
            {f.key === 'ALL'
              ? ` (${counts.ALL ?? 0})`
              : counts[f.key]
                ? ` (${counts[f.key]})`
                : ''}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className={d.empty}>لا توجد مواعيد في هذا التصنيف</div>
      ) : (
        filtered.map((app, index) => (
          <article
            key={app.id}
            className={d.apptCard}
            style={{ animationDelay: `${Math.min(index * 0.06, 0.5)}s` }}
          >
            <div className={d.apptTop}>
              <div>
                <Link
                  href={`/doctor/patients/${app.patientId}`}
                  className={d.apptPatient}
                >
                  {app.patient?.fullName || 'مريض'}
                </Link>
                <div className={d.apptMeta}>
                  {formatDate(app.scheduledAt)} · العمر {app.patient?.age ?? '—'} ·{' '}
                  {formatCurrency(app.amountPaid || app.consultationFee)} ·{' '}
                  {paymentMethodLabel[app.paymentMethod || 'CASH'] || 'نقدي'}
                  {app.paymentMethod === 'ELECTRONIC' &&
                  app.consultationPaymentStatus === 'PAID'
                    ? ' · مدفوع'
                    : app.paymentMethod === 'ELECTRONIC'
                      ? ' · بانتظار الدفع'
                      : ''}
                </div>
                {app.patientCondition ? (
                  <div className={d.apptMeta} style={{ marginTop: 4 }}>
                    {app.patientCondition}
                  </div>
                ) : null}
              </div>
              <span className={`${d.pill} ${statusPill(app.status)}`}>
                {appointmentStatusLabel[app.status] || app.status}
              </span>
            </div>

            <div className={d.apptActions}>
              {app.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    className={`${d.miniBtn} ${d.miniBtnPrimary}`}
                    disabled={busyId === app.id}
                    onClick={() => void confirmAppointment(app.id)}
                  >
                    تأكيد
                  </button>
                  <button
                    type="button"
                    className={`${d.miniBtn} ${d.miniBtnDanger}`}
                    disabled={busyId === app.id}
                    onClick={() => {
                      setRejectId(app.id);
                      setRejectMessage('');
                    }}
                  >
                    رفض
                  </button>
                </>
              ) : null}
              {app.status === 'CONFIRMED' ? (
                <button
                  type="button"
                  className={`${d.miniBtn} ${d.miniBtnSecondary}`}
                  disabled={busyId === app.id}
                  onClick={() => {
                    setCompleteId(app.id);
                    setPatientCondition('');
                  }}
                >
                  إكمال
                </button>
              ) : null}
              {app.status === 'COMPLETED' && !app.prescription ? (
                <button
                  type="button"
                  className={`${d.miniBtn} ${d.miniBtnGhost}`}
                  onClick={() => {
                    setRxAppointment(app);
                    setMedications([emptyMed()]);
                    setRxNotes('');
                  }}
                >
                  وصفة إلكترونية
                </button>
              ) : null}
              {app.prescription ? (
                <span className={`${d.pill} ${d.pillConfirmed}`}>وصفة موجودة</span>
              ) : null}
            </div>
          </article>
        ))
      )}

      <Modal open={Boolean(rejectId)} title="رفض الموعد" onClose={() => setRejectId(null)}>
        <form onSubmit={submitReject}>
          <div className="field">
            <label htmlFor="rejectMessage">رسالة الرفض (مطلوبة)</label>
            <textarea
              id="rejectMessage"
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
              required
              placeholder="اكتب سبب الرفض للمريض"
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-danger" disabled={!rejectMessage.trim()}>
              تأكيد الرفض
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setRejectId(null)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(completeId)} title="إكمال الموعد" onClose={() => setCompleteId(null)}>
        <form onSubmit={submitComplete}>
          <div className="field">
            <label htmlFor="patientCondition">حالة المريض (اختياري)</label>
            <textarea
              id="patientCondition"
              value={patientCondition}
              onChange={(e) => setPatientCondition(e.target.value)}
              placeholder="مثال: مستقر مع ارتفاع طفيف في السكر"
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-primary">إكمال الموعد</button>
            <button type="button" className="btn btn-ghost" onClick={() => setCompleteId(null)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(rxAppointment)}
        title="إنشاء وصفة إلكترونية"
        onClose={() => setRxAppointment(null)}
      >
        <form onSubmit={submitPrescription}>
          {medications.map((med, index) => (
            <div
              key={index}
              className="card card-pad"
              style={{ marginBottom: '0.8rem', boxShadow: 'none' }}
            >
              <div className="field-row">
                <div className="field">
                  <label>اسم الدواء</label>
                  <input
                    value={med.name}
                    onChange={(e) => {
                      const next = [...medications];
                      next[index] = { ...med, name: e.target.value };
                      setMedications(next);
                    }}
                    required
                  />
                </div>
                <div className="field">
                  <label>الجرعة</label>
                  <input
                    value={med.dosage}
                    onChange={(e) => {
                      const next = [...medications];
                      next[index] = { ...med, dosage: e.target.value };
                      setMedications(next);
                    }}
                    required
                  />
                </div>
              </div>
              <div className="field">
                <label>التعليمات</label>
                <input
                  value={med.instructions || ''}
                  onChange={(e) => {
                    const next = [...medications];
                    next[index] = { ...med, instructions: e.target.value };
                    setMedications(next);
                  }}
                />
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={med.isRestricted}
                  onChange={(e) => {
                    const next = [...medications];
                    next[index] = { ...med, isRestricted: e.target.checked };
                    setMedications(next);
                  }}
                />
                دواء مقيد
              </label>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setMedications((prev) => [...prev, emptyMed()])}
            style={{ marginBottom: '1rem' }}
          >
            إضافة دواء
          </button>

          <div className="field">
            <label htmlFor="rxNotes">ملاحظات</label>
            <textarea id="rxNotes" value={rxNotes} onChange={(e) => setRxNotes(e.target.value)} />
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary">حفظ الوصفة</button>
            <button type="button" className="btn btn-ghost" onClick={() => setRxAppointment(null)}>
              إلغاء
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
