'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const DOCTOR_URL =
  process.env.NEXT_PUBLIC_DOCTOR_URL ?? 'http://localhost:3000';

interface GuestGuardProps {
  children: React.ReactNode;
  redirectRole?: Role;
  redirectTo: string;
}

export function GuestGuard({
  children,
  redirectRole,
  redirectTo,
}: GuestGuardProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (redirectRole) {
      if (hasRole(redirectRole)) {
        router.replace(redirectTo);
      } else if (user.role === 'DOCTOR') {
        window.location.href = `${DOCTOR_URL}/doctor`;
      } else {
        router.replace('/');
      }
      return;
    }

    if (user.role === 'ADMIN') router.replace('/admin');
    else if (user.role === 'DOCTOR') {
      window.location.href = `${DOCTOR_URL}/doctor`;
    } else {
      router.replace(redirectTo);
    }
  }, [loading, user, hasRole, redirectRole, redirectTo, router]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          <div>جاري التحقق من الجلسة...</div>
        </div>
      </div>
    );
  }

  if (user) {
    const shouldBlock = redirectRole ? hasRole(redirectRole) : true;
    if (shouldBlock || user.role === 'ADMIN' || user.role === 'DOCTOR') {
      return (
        <div className="auth-loading">
          <div>
            <div className="spinner" style={{ marginInline: 'auto' }} />
            <div>جاري تحويلك...</div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
