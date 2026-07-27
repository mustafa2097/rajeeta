'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002';

interface GuestGuardProps {
  children: React.ReactNode;
  /** If set, only redirect when user has this role */
  redirectRole?: Role;
  redirectTo: string;
}

/** Prevents logged-in users from seeing login/register pages (back-button safe). */
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
      } else if (user.role === 'ADMIN') {
        window.location.href = `${ADMIN_URL}/admin`;
      } else if (user.role === 'DOCTOR') {
        router.replace('/doctor');
      } else {
        router.replace('/');
      }
      return;
    }

    if (user.role === 'ADMIN') {
      window.location.href = `${ADMIN_URL}/admin`;
    } else if (user.role === 'DOCTOR') {
      router.replace('/doctor');
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
