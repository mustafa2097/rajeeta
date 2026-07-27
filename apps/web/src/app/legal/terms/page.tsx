import Link from 'next/link';
import { readFile } from 'fs/promises';
import path from 'path';
import styles from '../../auth.module.css';

export const metadata = {
  title: 'شروط الاستخدام | راجيتة',
};

export default async function TermsPage() {
  const filePath = path.join(process.cwd(), 'public', 'legal', 'terms.txt');
  const text = await readFile(filePath, 'utf8');

  return (
    <div className={styles.page}>
      <div className={`${styles.card} ${styles.wide}`}>
        <div className={styles.brand}>
          <img src="/logo.png" alt="راجيتة" className={styles.logoImg} />
          <h1>شروط الاستخدام</h1>
          <p>تطبيق راجيتة للرعاية الصحية</p>
        </div>
        <pre className={styles.legalText}>{text}</pre>
        <div className={styles.footerLinks}>
          <Link href="/doctor/register">العودة للتسجيل</Link>
          {' · '}
          <Link href="/legal/privacy">سياسة الخصوصية</Link>
        </div>
      </div>
    </div>
  );
}
