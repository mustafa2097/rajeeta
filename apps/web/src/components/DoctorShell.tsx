'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from './AuthGuard';
import { useAuth } from '@/lib/auth';
import styles from './DoctorShell.module.css';

const navItems = [
  { href: '/doctor', label: 'الرئيسية', icon: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z' },
  { href: '/doctor/appointments', label: 'المواعيد', icon: 'M7 3v2M17 3v2M4 9h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z' },
  { href: '/doctor/wallet', label: 'المحفظة', icon: 'M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm16 0V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v2' },
  { href: '/doctor/subscribe', label: 'الاشتراك', icon: 'M12 2l2.4 4.9L20 8l-4 3.9.9 5.6L12 15.8 7.1 17.5 8 11.9 4 8l5.6-1.1L12 2Z' },
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg className={styles.navIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function initials(name: string) {
  const parts = name.replace(/د\.?/g, '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'ر';
  if (parts.length === 1) return parts[0][0];
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

export function DoctorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName = user?.doctorProfile?.fullName || user?.email || 'طبيب';

  const isActive = (href: string) =>
    pathname === href ||
    (href !== '/doctor' && pathname.startsWith(href));

  const handleLogout = () => {
    logout();
    router.replace('/doctor/login');
  };

  return (
    <AuthGuard role="DOCTOR" loginPath="/doctor/login">
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <Link href="/doctor" className={styles.brand}>
              <img src="/logo.png" alt="راجيتة" className={styles.logo} />
              <span>راجيتة</span>
            </Link>

            <nav className={styles.nav} aria-label="تنقل الطبيب">
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
                <div className={styles.avatar}>{initials(displayName)}</div>
              </div>
              <div className={styles.userMeta}>
                <div className={styles.userName}>{displayName}</div>
                <div className={styles.userEmail}>{user?.email}</div>
              </div>
              <button type="button" className={styles.logout} onClick={handleLogout}>
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
