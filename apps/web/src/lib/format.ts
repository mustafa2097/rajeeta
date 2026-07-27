export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-IQ')} د.ع`;
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('ar-IQ', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ar-IQ', {
    dateStyle: 'medium',
  });
}

export const appointmentStatusLabel: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  REJECTED: 'مرفوض',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغى',
};

export const subscriptionStatusLabel: Record<string, string> = {
  NONE: 'غير مشترك',
  TRIAL: 'فترة تجريبية',
  ACTIVE: 'نشط',
  EXPIRED: 'منتهي',
};

export const roleLabel: Record<string, string> = {
  PATIENT: 'مريض',
  DOCTOR: 'طبيب',
  ADMIN: 'مسؤول',
};

export const walletTypeLabel: Record<string, string> = {
  CONSULTATION: 'استشارة نقدية',
  CASH_CONSULTATION: 'استشارة نقدية',
  ELECTRONIC_CONSULTATION: 'دفع إلكتروني',
  DISCOUNT_CREDIT: 'تعويض خصم',
  WITHDRAWAL: 'سحب',
  SUBSCRIPTION: 'اشتراك',
  ADJUSTMENT: 'تعديل',
  REFUND: 'استرداد',
};

export const paymentMethodLabel: Record<string, string> = {
  CASH: 'نقدي',
  ELECTRONIC: 'دفع إلكتروني',
};

export const paymentTypeLabel: Record<string, string> = {
  SUBSCRIPTION: 'اشتراك',
  WITHDRAWAL: 'سحب',
  CONSULTATION: 'استشارة',
};
