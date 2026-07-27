'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import styles from './Sidebar.module.css';

export interface NavItem {
  href: string;
  label: string;
}

interface SidebarProps {
  title: string;
  items: NavItem[];
  loginPath: string;
}

export function Sidebar({ title, items, loginPath }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const displayName =
    user?.doctorProfile?.fullName ||
    user?.adminProfile?.fullName ||
    user?.email ||
    'مستخدم';

  const handleLogout = () => {
    logout();
    router.replace(loginPath);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src="/logo.png" alt="راجيتة" className={styles.logo} />
        <div>
          <div className={styles.brandName}>راجيتة</div>
          <div className={styles.brandSub}>{title}</div>
        </div>
      </div>

      <div className={styles.userBox}>
        <div className={styles.userName}>{displayName}</div>
        <div className={styles.userEmail}>{user?.email}</div>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== '/doctor' &&
              item.href !== '/admin' &&
              pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.link} ${active ? styles.active : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button type="button" className={styles.logout} onClick={handleLogout}>
        تسجيل الخروج
      </button>
    </aside>
  );
}
