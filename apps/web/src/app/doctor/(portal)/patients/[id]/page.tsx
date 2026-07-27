'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, apiUpload, ApiError } from '@/lib/api';
import {
  appointmentStatusLabel,
  formatCurrency,
  formatDate,
} from '@/lib/format';
import type { PatientProfile } from '@/lib/types';
import { doctorImages } from '@/lib/doctor-images';
import d from '@/styles/doctor.module.css';

export default function PatientProfilePage() {
  const params = useParams<{ id: string }>();
  const patientId = params.id;
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    try {
      const data = await api<PatientProfile>(`/patients/${patientId}`);
      setPatient(data);
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'تعذر تحميل ملف المريض');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const uploadHandwritten = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('يرجى اختيار صورة الوصفة');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const body = new FormData();
      body.append('image', file);
      body.append('patientId', patientId);
      if (notes.trim()) body.append('notes', notes.trim());
      await apiUpload('/prescriptions/handwritten', body);
      setSuccess('تم رفع الوصفة المكتوبة بنجاح');
      setFile(null);
      setNotes('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل رفع الوصفة');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          جاري تحميل ملف المريض...
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div>
        <div className="alert alert-error">{error || 'المريض غير موجود'}</div>
        <Link href="/doctor/appointments" className="btn btn-secondary">
          العودة للمواعيد
        </Link>
      </div>
    );
  }

  const labResults = patient.labResults;

  return (
    <div>
      <Link href="/doctor/appointments" className={d.sectionLink} style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← العودة للمواعيد
      </Link>

      <section className={d.hero} style={{ minHeight: 200, marginBottom: '1.5rem' }}>
        <img src={doctorImages.patients} alt="" className={d.heroImg} />
        <div className={d.heroOverlay}>
          <span className={d.eyebrow}>ملف المريض</span>
          <h1 className={d.heroTitle} style={{ fontSize: '2rem' }}>{patient.fullName}</h1>
          <p className={d.heroLead}>
            العمر {patient.age} · فصيلة الدم {patient.bloodType || '—'} · {patient.user?.phone || '—'}
          </p>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className={d.statsRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={d.statTile}>
          <div className={d.statLabel}>العمر</div>
          <div className={d.statValue}>{patient.age}</div>
        </div>
        <div className={d.statTile}>
          <div className={d.statLabel}>فصيلة الدم</div>
          <div className={d.statValue}>{patient.bloodType || '—'}</div>
        </div>
        <div className={d.statTile}>
          <div className={d.statLabel}>المواعيد</div>
          <div className={d.statValue}>{patient.appointments?.length ?? 0}</div>
        </div>
      </div>

      <div className={d.grid2} style={{ marginTop: '1.5rem' }}>
        <section className={`${d.panel} ${d.panelPad}`}>
          <h2 className={d.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>الأمراض المزمنة</h2>
          {patient.chronicDiseases && patient.chronicDiseases.length > 0 ? (
            <div className={d.chipGrid}>
              {patient.chronicDiseases.map((item) => (
                <span key={item} className={d.chip}>{item}</span>
              ))}
            </div>
          ) : (
            <div className={d.empty}>لا توجد أمراض مزمنة مسجلة</div>
          )}
        </section>

        <section className={`${d.panel} ${d.panelPad}`}>
          <h2 className={d.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '0.75rem' }}>نتائج التحاليل</h2>
          {!labResults ? (
            <div className={d.empty}>لا توجد نتائج تحاليل</div>
          ) : (
            <div className={d.chipGrid}>
              {Object.entries(labResults as Record<string, unknown>).map(([key, value]) => (
                <span key={key} className={d.chip}>
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      <section className={d.section} style={{ marginTop: '1.5rem' }}>
        <h2 className={d.sectionTitle}>المواعيد</h2>
        <div className={d.panel}>
          {!patient.appointments?.length ? (
            <div className={d.empty}>لا توجد مواعيد</div>
          ) : (
            patient.appointments.map((app) => (
              <div key={app.id} className={d.listItem}>
                <div className={d.listMain}>
                  <div className={d.listTitle}>{formatDate(app.scheduledAt)}</div>
                  <div className={d.listSub}>
                    {appointmentStatusLabel[app.status] || app.status} · {formatCurrency(app.amountPaid || app.consultationFee)}
                    {app.patientCondition ? ` · ${app.patientCondition}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className={d.section}>
        <h2 className={d.sectionTitle}>الوصفات الإلكترونية</h2>
        {!patient.prescriptions?.length ? (
          <div className={d.empty}>لا توجد وصفات إلكترونية</div>
        ) : (
          patient.prescriptions.map((rx) => (
            <div key={rx.id} className={`${d.apptCard}`}>
              <div className={d.apptMeta} style={{ marginBottom: 8 }}>{formatDate(rx.createdAt)}</div>
              <ul style={{ paddingInlineStart: '1.2rem', lineHeight: 1.8 }}>
                {rx.medications.map((m, idx) => (
                  <li key={idx}>
                    <strong>{m.name}</strong> — {m.dosage}
                    {m.instructions ? ` (${m.instructions})` : ''}
                    {m.isRestricted ? ' [مقيد]' : ''}
                  </li>
                ))}
              </ul>
              {rx.notes ? <p style={{ marginTop: 8, color: '#86868b' }}>{rx.notes}</p> : null}
            </div>
          ))
        )}
      </section>

      <section className={d.section}>
        <h2 className={d.sectionTitle}>الوصفات المكتوبة بخط اليد</h2>
        {!patient.handwrittenPrescriptions?.length ? (
          <div className={d.empty}>لا توجد وصفات مكتوبة</div>
        ) : (
          patient.handwrittenPrescriptions.map((rx) => (
            <div key={rx.id} className={d.apptCard}>
              <div className={d.apptMeta}>{formatDate(rx.createdAt)}</div>
              {rx.notes ? <p style={{ margin: '0.5rem 0' }}>{rx.notes}</p> : null}
              <a
                href={rx.imageUrl.startsWith('http') ? rx.imageUrl : `${(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api$/, '')}${rx.imageUrl}`}
                target="_blank"
                rel="noreferrer"
                className={d.sectionLink}
              >
                عرض الصورة
              </a>
            </div>
          ))
        )}

        <div className={`${d.panel} ${d.panelPad}`} style={{ marginTop: '1rem' }}>
          <form onSubmit={uploadHandwritten}>
            <h3 className={d.sectionTitle} style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>رفع وصفة مكتوبة</h3>
            <div className="field">
              <label htmlFor="image">صورة الوصفة</label>
              <input id="image" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </div>
            <div className="field">
              <label htmlFor="notes">ملاحظات</label>
              <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={uploading}>
              {uploading ? 'جاري الرفع...' : 'رفع الوصفة'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
