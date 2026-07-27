'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const DOCTOR_URL =
  process.env.NEXT_PUBLIC_DOCTOR_URL ?? 'http://localhost:3000';

interface AuthGuardProps {
  role: Role | Role[];
  children: React.ReactNode;
  loginPath: string;
}

export function AuthGuard({ role, children, loginPath }: AuthGuardProps) {
  const { user, loading, hasRole } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(loginPath);
      return;
    }
    if (!hasRole(role)) {
      if (user.role === 'DOCTOR') {
        window.location.href = `${DOCTOR_URL}/doctor`;
      } else {
        router.replace('/');
      }
    }
  }, [loading, user, hasRole, role, router, loginPath, pathname]);

  if (loading || !user || !hasRole(role)) {
    return (
      <div className="auth-loading">
        <div>
          <div className="spinner" style={{ marginInline: 'auto' }} />
          <div>جاري التحقق من الجلسة...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
