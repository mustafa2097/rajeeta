import Link from 'next/link';
import { doctorImages } from '@/lib/doctor-images';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand}>
            <img src="/logo.png" alt="راجيتة" className={styles.logo} />
            <span>راجيتة</span>
          </Link>
          <nav className={styles.topNav}>
            <Link href="/doctor/login">دخول الطبيب</Link>
            <Link href="/doctor/register" className={styles.navCta}>
              تسجيل طبيب
            </Link>
          </nav>
        </div>
      </header>

      <section className={styles.heroFull}>
        <img src={doctorImages.hero} alt="" className={styles.heroBg} />
        <div className={styles.heroContent}>
          <span className={`${styles.eyebrow} ${styles.fadeUp}`}>منصة طبية عراقية</span>
          <h1 className={`${styles.heroTitle} ${styles.fadeUp} ${styles.delay1}`}>
            عيادتك.
            <br />
            ببساطة أكثر.
          </h1>
          <p className={`${styles.heroLead} ${styles.fadeUp} ${styles.delay2}`}>
            راجيتة تمنح الأطباء أدوات إدارة المواعيد والوصفات — بتصميم
            بسيط ومنظم.
          </p>
          <div className={`${styles.heroActions} ${styles.fadeUp} ${styles.delay3}`}>
            <Link href="/doctor/register" className={styles.btnPrimary}>
              ابدأ مجاناً
            </Link>
            <Link href="/doctor/login" className={styles.btnGhost}>
              دخول الطبيب
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.showcase}>
        <div className={`${styles.showcaseItem} ${styles.delay1}`}>
          <div className={styles.showcaseCopy}>
            <span className={styles.eyebrowDark}>المواعيد</span>
            <h2>كل موعد في مكانه.</h2>
            <p>تأكيد، رفض، وإكمال المواعيد بخطوات واضحة.</p>
            <Link href="/doctor/appointments" className={styles.textLink}>
              استكشف المواعيد ←
            </Link>
          </div>
          <div className={styles.showcaseVisual}>
            <img src={doctorImages.patients} alt="" />
          </div>
        </div>

        <div className={`${styles.showcaseItem} ${styles.showcaseReverse} ${styles.delay2}`}>
          <div className={styles.showcaseCopy}>
            <span className={styles.eyebrowDark}>الوصفات</span>
            <h2>وصفات رقمية. بدون تعقيد.</h2>
            <p>وصفات إلكترونية أو مكتوبة مرتبطة بملف المريض.</p>
            <Link href="/doctor/login" className={styles.textLink}>
              جرّب الآن ←
            </Link>
          </div>
          <div className={styles.showcaseVisual}>
            <img src={doctorImages.technology} alt="" />
          </div>
        </div>

        <div className={`${styles.showcaseItem} ${styles.delay3}`}>
          <div className={styles.showcaseCopy}>
            <span className={styles.eyebrowDark}>المحفظة</span>
            <h2>إيراداتك. واضحة.</h2>
            <p>تتبع الأتعاب والسحوبات بعملة د.ع.</p>
            <Link href="/doctor/wallet" className={styles.textLink}>
              عرض المحفظة ←
            </Link>
          </div>
          <div className={styles.showcaseVisual}>
            <img src={doctorImages.wallet} alt="" />
          </div>
        </div>
      </section>

      <section className={styles.aiSlope}>
        <div className={styles.aiSlopeInner}>
          <div className={styles.aiSlopeCopy}>
            <span className={styles.aiBadge}>مساعد ذكي</span>
            <h2>تشخيص أذكى. توصية أسرع.</h2>
            <p>
              المريض يصف أعراضه، والمساعد الذكي يقترح التخصص والأطباء المناسبين —
              تجربة عملية تختصر وقت الحجز وتزيد دقة الاختيار.
            </p>
            <ul className={styles.aiList}>
              <li>تحليل الأعراض بلغة طبيعية</li>
              <li>اقتراح تخصص طبي مناسب</li>
              <li>ربط مباشر بأطباء متاحين</li>
            </ul>
          </div>
          <div className={styles.aiSlopeCard}>
            <div className={styles.aiChatMock}>
              <div className={styles.aiBubbleUser}>أشعر بألم في الصدر منذ يومين</div>
              <div className={styles.aiBubbleBot}>
                <strong>التخصص المقترح:</strong> أمراض القلب
                <span>٣ أطباء متاحون للحجز اليوم</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.ctaBand}>
        <div className={styles.ctaInner}>
          <h2>شهران مجاناً. ثم 35,000 د.ع / شهر.</h2>
          <p>انضم إلى راجيتة وابدأ إدارة عيادتك اليوم.</p>
          <Link href="/doctor/register" className={styles.btnPrimary}>
            سجّل كطبيب
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} راجيتة</p>
      </footer>
    </div>
  );
}
