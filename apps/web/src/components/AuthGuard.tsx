'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

const ADMIN_URL =
  process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3002';

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
      if (user.role === 'ADMIN') {
        window.location.href = `${ADMIN_URL}/admin`;
      } else if (user.role === 'DOCTOR') {
        router.replace('/doctor');
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
