'use client';

import {
  formatCurrency,
  formatDate,
  subscriptionStatusLabel,
} from '@/lib/format';
import { displayNameForUser, profileInitials } from '@/lib/names';
import type { User } from '@/lib/types';
import a from '@/styles/admin.module.css';

function subscriptionPill(status: string) {
  const map: Record<string, string> = {
    ACTIVE: a.pillActive,
    TRIAL: a.pillTrial,
    EXPIRED: a.pillExpired,
    NONE: a.pillNone,
  };
  return map[status] ?? a.pillNone;
}

interface PersonProfileCardProps {
  user: User;
  index?: number;
}

export function DoctorProfileCard({ user, index = 0 }: PersonProfileCardProps) {
  const profile = user.doctorProfile;
  const name = displayNameForUser(user);
  const sub = profile?.subscriptionStatus || 'NONE';

  return (
    <article
      className={a.profileCard}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <div className={a.profileTop}>
        <div className={a.avatar}>{profileInitials(name)}</div>
        <div className={a.profileMain}>
          <div className={a.profileName}>{name}</div>
          <div className={a.profileMeta}>
            {profile?.specialty || '—'} · {user.email}
          </div>
        </div>
        <span className={`${a.pill} ${subscriptionPill(sub)}`}>
          {subscriptionStatusLabel[sub] || sub}
        </span>
      </div>

      <div className={a.profileDetails}>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>الهاتف</div>
          <div className={a.detailValue}>{user.phone}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>العمر</div>
          <div className={a.detailValue}>{profile?.age ?? '—'}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>العيادة</div>
          <div className={a.detailValue}>{profile?.clinicName || '—'}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>رسوم الاستشارة</div>
          <div className={a.detailValue}>
            {formatCurrency(profile?.consultationFee ?? 0)}
          </div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>التقييم</div>
          <div className={a.detailValue}>
            ★ {(profile?.rating ?? 0).toFixed(1)}
          </div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>رصيد قابل للسحب</div>
          <div className={a.detailValue}>
            {formatCurrency(profile?.wallet?.balance ?? 0)}
          </div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>تاريخ التسجيل</div>
          <div className={a.detailValue}>{formatDate(user.createdAt)}</div>
        </div>
        {profile?.clinicAddress ? (
          <div className={a.detailItem}>
            <div className={a.detailLabel}>العنوان</div>
            <div className={a.detailValue}>{profile.clinicAddress}</div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function PatientProfileCard({ user, index = 0 }: PersonProfileCardProps) {
  const profile = user.patientProfile;
  const name = displayNameForUser(user);
  const diseases = profile?.chronicDiseases?.filter(Boolean) ?? [];

  return (
    <article
      className={a.profileCard}
      style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
    >
      <div className={a.profileTop}>
        <div className={a.avatar}>{profileInitials(name)}</div>
        <div className={a.profileMain}>
          <div className={a.profileName}>{name}</div>
          <div className={a.profileMeta}>
            مريض · {user.email}
          </div>
        </div>
      </div>

      <div className={a.profileDetails}>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>الهاتف</div>
          <div className={a.detailValue}>{user.phone}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>العمر</div>
          <div className={a.detailValue}>{profile?.age ?? '—'}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>فصيلة الدم</div>
          <div className={a.detailValue}>{profile?.bloodType || '—'}</div>
        </div>
        <div className={a.detailItem}>
          <div className={a.detailLabel}>تاريخ التسجيل</div>
          <div className={a.detailValue}>{formatDate(user.createdAt)}</div>
        </div>
        {diseases.length > 0 ? (
          <div className={a.detailItem} style={{ gridColumn: '1 / -1' }}>
            <div className={a.detailLabel}>أمراض مزمنة</div>
            <div className={a.detailValue}>{diseases.join(' · ')}</div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
