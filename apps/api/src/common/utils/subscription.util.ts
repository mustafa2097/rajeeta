import { DoctorProfile, SubscriptionStatus } from '@prisma/client';

export function isSubscribed(
  doctor: Pick<
    DoctorProfile,
    'subscriptionStatus' | 'trialEndsAt' | 'subscriptionEndsAt'
  >,
  now = new Date(),
): boolean {
  if (doctor.subscriptionStatus === SubscriptionStatus.ACTIVE) {
    return !doctor.subscriptionEndsAt || doctor.subscriptionEndsAt > now;
  }

  if (doctor.subscriptionStatus === SubscriptionStatus.TRIAL) {
    return !doctor.trialEndsAt || doctor.trialEndsAt > now;
  }

  return false;
}

/** Mon=0 .. Sun=6 (matches seed availability) */
export function toDayOfWeek(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isWithinSlot(
  date: Date,
  startTime: string,
  endTime: string,
): boolean {
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= timeToMinutes(startTime) && minutes < timeToMinutes(endTime);
}

export function stripPassword<T extends { passwordHash?: string }>(
  user: T,
): Omit<T, 'passwordHash'> {
  const { passwordHash: _, ...rest } = user;
  return rest;
}
