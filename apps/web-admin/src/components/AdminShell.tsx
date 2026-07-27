'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '@/lib/auth';
import { profileInitials } from '@/lib/names';
import styles from './AdminShell.module.css';

const navItems = [
  {
    href: '/admin',
    label: 'نظرة عامة',
    icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  },
  {
    href: '/admin/doctors',
    label: 'الأطباء',
    icon: 'M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-8 9a8 8 0 0 1 16 0',
  },
  {
    href: '/admin/patients',
    label: 'المرضى',
    icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 4-4 4 4 0 0 0-4 4Z',
  },
  {
    href: '/admin/transactions',
    label: 'التحويلات',
    icon: 'M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm16 0V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2',
  },
  {
    href: '/admin/discount-codes',
    label: 'أكواد الخصم',
    icon: 'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z',
  },
  {
    href: '/admin/admins',
    label: 'إنشاء أدمن',
    icon: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2',
  },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg
      className={styles.navIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName =
    user?.adminProfile?.fullName || user?.email || 'مسؤول';

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/admin' && pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  return (
    <AuthGuard role="ADMIN" loginPath="/admin/login">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/admin" className={styles.brand}>
              <img src="/logo.png" alt="راجيتة" className={styles.logo} />
              <span>راجيتة — الإدارة</span>
            </Link>

            <nav className={styles.nav} aria-label="تنقل الإدارة">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                >
                  <NavIcon d={item.icon} />
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className={styles.actions}>
              <div className={styles.avatarMobile} aria-hidden>
                <div className={styles.avatar}>
                  {profileInitials(displayName)}
                </div>
              </div>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{displayName}</div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
              <button
                type="button"
                className={styles.logout}
                onClick={handleLogout}
              >
                خروج
              </button>
            </div>
          </div>
        </header>

        <nav className={styles.mobileNav} aria-label="تنقل الجوال">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
            >
              <NavIcon d={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <main className={styles.main}>{children}</main>
      </div>
    </AuthGuard>
  );
}
