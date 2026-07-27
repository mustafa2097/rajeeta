'use client';



import { FormEvent, useCallback, useEffect, useState } from 'react';

import { api, ApiError } from '@/lib/api';

import { doctorImages } from '@/lib/doctor-images';

import { formatCurrency, formatDate, walletTypeLabel } from '@/lib/format';

import type { Wallet } from '@/lib/types';

import d from '@/styles/doctor.module.css';



export default function DoctorWalletPage() {

  const [wallet, setWallet] = useState<Wallet | null>(null);

  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');



  const load = useCallback(async () => {

    try {

      const data = await api<Wallet>('/wallet');

      setWallet(data);

      setError('');

    } catch (err) {

      setError(err instanceof ApiError ? err.message : 'تعذر تحميل المحفظة');

    } finally {

      setLoading(false);

    }

  }, []);



  useEffect(() => {

    void load();

  }, [load]);



  const onWithdraw = async (e: FormEvent) => {

    e.preventDefault();

    setSubmitting(true);

    setError('');

    setSuccess('');

    try {

      await api('/wallet/withdraw', {

        method: 'POST',

        body: JSON.stringify({ amount: Number(amount) }),

      });

      setSuccess('تم تنفيذ طلب السحب بنجاح');

      setAmount('');

      await load();

    } catch (err) {

      setError(err instanceof ApiError ? err.message : 'فشل السحب');

    } finally {

      setSubmitting(false);

    }

  };



  if (loading) {

    return (

      <div className="loading-screen">

        <div>

          <div className="spinner" style={{ marginInline: 'auto' }} />

          جاري تحميل المحفظة...

        </div>

      </div>

    );

  }



  const totalEarnings = wallet?.totalEarnings ?? wallet?.balance ?? 0;

  const withdrawable = wallet?.withdrawableBalance ?? wallet?.balance ?? 0;



  return (

    <div>

      <div className={d.statsRow} style={{ gridTemplateColumns: '1fr 1fr' }}>

        <section className={d.balanceHero} style={{ minHeight: 180, marginBottom: 0 }}>

          <img src={doctorImages.wallet} alt="" className={d.balanceImg} />

          <div className={d.balanceBody}>

            <div className={d.balanceLabel}>إجمالي أرباحك</div>

            <div className={d.balanceValue}>{formatCurrency(totalEarnings)}</div>

            <p style={{ marginTop: '0.5rem', fontSize: '0.88rem', opacity: 0.9 }}>

              نقدي + دفع إلكتروني + تعويض الخصم

            </p>

          </div>

        </section>



        <section

          className={d.balanceHero}

          style={{ minHeight: 180, marginBottom: 0, background: '#00415c' }}

        >

          <div className={d.balanceBody}>

            <div className={d.balanceLabel}>رصيد المحفظة (قابل للسحب)</div>

            <div className={d.balanceValue}>{formatCurrency(withdrawable)}</div>

            <p style={{ marginTop: '0.5rem', fontSize: '0.88rem', opacity: 0.9 }}>

              يزيد بالدفع الإلكتروني وتعويض الخصم فقط — بدون الكشفية النقدية

            </p>

          </div>

        </section>

      </div>



      {error ? <div className="alert alert-error">{error}</div> : null}

      {success ? <div className="alert alert-success">{success}</div> : null}



      <div className={d.grid2} style={{ marginTop: '1.5rem' }}>

        <section className={`${d.panel} ${d.panelPad}`}>

          <h2 className={d.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>

            سحب رصيد

          </h2>

          <form onSubmit={onWithdraw}>

            <div className="field">

              <label htmlFor="amount">المبلغ (د.ع)</label>

              <input

                id="amount"

                type="number"

                min={1}

                max={withdrawable}

                value={amount}

                onChange={(e) => setAmount(e.target.value)}

                required

              />

            </div>

            <button className="btn btn-primary" disabled={submitting}>

              {submitting ? 'جاري السحب...' : 'سحب الآن'}

            </button>

          </form>

        </section>



        <section className={`${d.panel} ${d.panelPad}`}>

          <h2 className={d.sectionTitle} style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>

            كيف تُحسب المحفظة؟

          </h2>

          <ul style={{ color: '#5a7a8a', lineHeight: 1.8, paddingInlineStart: '1.1rem' }}>

            <li>الكشفية النقدية تُسجّل في إجمالي الأرباح فقط.</li>

            <li>الدفع الإلكتروني يُضاف للمحفظة ويمكن سحبه.</li>

            <li>تعويض كود الخصم يُضاف للمحفظة ويمكن سحبه.</li>

          </ul>

        </section>

      </div>



      <section className={d.section} style={{ marginTop: '1.5rem' }}>

        <div className={d.sectionHead}>

          <h2 className={d.sectionTitle}>سجل المعاملات</h2>

        </div>

        <div className={d.panel}>

          {!wallet?.transactions?.length ? (

            <div className={d.empty}>لا توجد معاملات</div>

          ) : (

            wallet.transactions.map((tx) => (

              <div key={tx.id} className={d.listItem}>

                <div className={d.listMain}>

                  <div className={d.listTitle}>

                    {walletTypeLabel[tx.type] || tx.type}

                  </div>

                  <div className={d.listSub}>

                    {formatDate(tx.createdAt)} · {tx.description || '—'}

                  </div>

                </div>

                <div

                  style={{

                    fontWeight: 700,

                    fontSize: '1.05rem',

                    color: tx.amount < 0 ? '#dc2626' : '#047857',

                  }}

                >

                  {formatCurrency(tx.amount)}

                </div>

              </div>

            ))

          )}

        </div>

      </section>

    </div>

  );

}


