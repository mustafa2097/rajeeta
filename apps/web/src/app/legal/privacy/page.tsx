import Link from 'next/link';
import { readFile } from 'fs/promises';
import path from 'path';
import styles from '../../auth.module.css';

export const metadata = {
  title: 'سياسة الخصوصية | راجيتة',
};

export default async function PrivacyPage() {
  const filePath = path.join(process.cwd(), 'public', 'legal', 'privacy.txt');
  const text = await readFile(filePath, 'utf8');

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.wide}`}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="راجيتة" className={styles.logoImg} />
          <h1>سياسة الخصوصية</h1>
          <p>تطبيق راجيتة للرعاية الصحية</p>
        </div>
        <pre className={styles.legalText}>{text}</pre>
        <div className={styles.footerLinks}>
          <Link href="/doctor/register">العودة للتسجيل</Link>
          {' · '}
          <Link href="/legal/terms">شروط الاستخدام</Link>
        </div>
      </div>
    </div>
  );
}
