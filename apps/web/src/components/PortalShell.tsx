'use client';

import { AuthGuard } from './AuthGuard';
import { Sidebar, type NavItem } from './Sidebar';
import styles from './PortalShell.module.css';
import type { Role } from '@/lib/types';

interface PortalShellProps {
  role: Role;
  title: string;
  items: NavItem[];
  loginPath: string;
  children: React.ReactNode;
}

export function PortalShell({
  role,
  title,
  items,
  loginPath,
  children,
}: PortalShellProps) {
  return (
    <AuthGuard role={role} loginPath={loginPath}>
      <div className={styles.layout}>
        <Sidebar title={title} items={items} loginPath={loginPath} />
        <main className={styles.main}>{children}</main>
      </div>
    </AuthGuard>
  );
}
