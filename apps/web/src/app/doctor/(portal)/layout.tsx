'use client';

import { DoctorShell } from '@/components/DoctorShell';

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DoctorShell>{children}</DoctorShell>;
}
