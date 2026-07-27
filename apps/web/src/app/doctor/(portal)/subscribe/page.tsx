'use client';

import { FormEvent, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { doctorImages } from '@/lib/doctor-images';
import {
  formatCurrency,
  formatDateOnly,
  subscriptionStatusLabel,
} from '@/lib/format';
import d from '@/styles/doctor.module.css';

export default function DoctorSubscribePage() {
  const { user, refreshUser } = useAuth();
  const doctor = user?.doctorProfile;
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const statusClass =
    doctor?.subscriptionStatus === 'ACTIVE'
      ? d.pillConfirmed
      : doctor?.subscriptionStatus === 'TRIAL'
        ? d.pillCompleted
        : doctor?.subscriptionStatus === 'EXPIRED'
          ? d.pillRejected
          : d.pillPending;

  const onPay = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api('/payments/subscribe', { method: 'POST' });
      setSuccess('تم تفعيل الاشتراك بنجاح');
      setCardNumber('');
      setCardName('');
      setExpiry('');
      setCvv('');
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'فشل الدفع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className={d.pricingHero}>
        <div className={d.pricingVisual}>
          <img src={doctorImages.subscribe} alt="" />
        </div>
        <div className={d.pricingContent}>
          <span className={d.pricingTag}>باقة الأطباء</span>
          <h1 className={d.pricingTitle}>اشترك في راجيتة</h1>
          <p style={{ color: '#86868b', lineHeight: 1.7 }}>
            شهران مجاناً للتجربة، ثم اشتراك شهري بسيط. كل أدوات إدارة العيادة في مكان واحد.
          </p>
          <div className={d.pricingPrice}>
            شهران مجاناً ثم {formatCurrency(35000)} / شهر
          </div>
          <span className={`${d.pill} ${statusClass}`}>
            {subscriptionStatusLabel[doctor?.subscriptionStatus || 'NONE']}
          </span>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className={d.statsRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={d.statTile}>
          <div className={d.statLabel}>نهاية التجربة</div>
          <div className={d.statValue} style={{ fontSize: '1.1rem' }}>
            {formatDateOnly(doctor?.trialEndsAt)}
          </div>
        </div>
        <div className={d.statTile}>
          <div className={d.statLabel}>نهاية الاشتراك</div>
          <div className={d.statValue} style={{ fontSize: '1.1rem' }}>
            {formatDateOnly(doctor?.subscriptionEndsAt)}
          </div>
        </div>
        <div className={d.statTile}>
          <div className={d.statLabel}>الأجرة الشهرية</div>
          <div className={d.statValue} style={{ fontSize: '1.1rem' }}>
            {formatCurrency(35000)}
          </div>
        </div>
      </div>

      <section className={`${d.panel} ${d.panelPad}`}>
        <h2 className={d.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
          الدفع (تجريبي)
        </h2>
        <p style={{ color: '#86868b', marginBottom: '1.25rem' }}>
          بيانات البطاقة لا تُحفظ ولا تُرسل إلى الخادم — للعرض فقط.
        </p>

        <form onSubmit={onPay} style={{ maxWidth: 520 }}>
          <div className="field">
            <label htmlFor="cardName">اسم حامل البطاقة</label>
            <input
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="cardNumber">رقم البطاقة</label>
            <input
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="XXXX XXXX XXXX XXXX"
              required
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="expiry">تاريخ الانتهاء</label>
              <input
                id="expiry"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                placeholder="MM/YY"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'جاري الدفع...' : 'ادفع الآن'}
          </button>
        </form>
      </section>
    </div>
  );
}
