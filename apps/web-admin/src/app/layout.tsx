import type { Metadata } from 'next';
import { Figtree, Noto_Sans_Arabic } from 'next/font/google';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'راجيتة — الإدارة',
  description: 'بوابة إدارة منصة راجيتة الطبية',
  icons: {
    icon: '/favicon.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${figtree.variable} ${notoArabic.variable}`}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
