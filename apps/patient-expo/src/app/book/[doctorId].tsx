import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AppInput,
  ErrorBanner,
  GlassCard,
  Header,
  LoadingState,
  PrimaryButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { colors, dayNames, formatIqd, radius, rtlText, spacing } from '@/constants/theme';
import { useData } from '@/context/data';
import { api, ApiError } from '@/lib/api';
import type { AvailabilitySlot, DiscountValidation, Doctor } from '@/types';

const apiDay = (date: Date) => (date.getDay() + 6) % 7;
const dateKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export default function BookingScreen() {
  const { doctorId } = useLocalSearchParams<{ doctorId: string }>();
  const router = useRouter();
  const { refreshAppointments } = useData();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<DiscountValidation | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ELECTRONIC'>('CASH');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    (async () => {
      try {
        const [doctorData, availabilityData] = await Promise.all([
          api.fetchDoctor(doctorId),
          api.fetchAvailability(doctorId),
        ]);
        setDoctor(doctorData);
        setSlots(availabilityData.filter((slot) => slot.isAvailable));
      } catch (cause) {
        setError(cause instanceof ApiError ? cause.message : 'تعذر تحميل أوقات الحجز');
      } finally {
        setLoading(false);
      }
    })();
  }, [doctorId]);

  const availableDates = useMemo(() => {
    const days = new Set(slots.map((slot) => slot.dayOfWeek));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() + index);
      return date;
    }).filter((date) => days.has(apiDay(date)));
  }, [slots]);

  const times = useMemo(() => {
    if (!selectedDate) return [];
    const daySlots = slots.filter((slot) => slot.dayOfWeek === apiDay(selectedDate));
    const result = new Set<string>();
    daySlots.forEach((slot) => {
      const [startHour, startMinute] = slot.startTime.split(':').map(Number);
      const [endHour, endMinute] = slot.endTime.split(':').map(Number);
      for (
        let minute = startHour * 60 + startMinute;
        minute < endHour * 60 + endMinute;
        minute += 30
      ) {
        const hour = Math.floor(minute / 60);
        const mins = minute % 60;
        const value = `${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        const candidate = new Date(selectedDate);
        candidate.setHours(hour, mins, 0, 0);
        if (candidate > new Date()) result.add(value);
      }
    });
    return [...result].sort();
  }, [selectedDate, slots]);

  const validateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscount(null);
      setDiscountError('');
      return;
    }
    try {
      const result = await api.validateDiscount(discountCode.trim());
      setDiscount(result);
      setDiscountError('');
    } catch (cause) {
      setDiscount(null);
      setDiscountError(cause instanceof ApiError ? cause.message : 'رمز الخصم غير صالح');
    }
  };

  const total = doctor
    ? Math.round(doctor.consultationFee * (1 - (discount?.percentage ?? 0) / 100))
    : 0;

  const confirm = async () => {
    if (!doctor || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError('');
    try {
      const [hour, minute] = selectedTime.split(':').map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(hour, minute, 0, 0);
      const appointment = await api.createAppointment({
        doctorId: doctor.id,
        scheduledAt: scheduledAt.toISOString(),
        discountCode: discount?.code,
        notes: notes.trim() || undefined,
        paymentMethod,
      });
      if (paymentMethod === 'ELECTRONIC') await api.payConsultation(appointment.id);
      await refreshAppointments();
      Alert.alert(
        'تم الحجز',
        paymentMethod === 'ELECTRONIC'
          ? 'تم الحجز والدفع الإلكتروني بنجاح.'
          : 'تم إرسال طلب الحجز إلى الطبيب.',
        [{ text: 'عرض المواعيد', onPress: () => router.replace('/(tabs)/appointments') }],
      );
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'تعذر إتمام الحجز');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Header title="حجز موعد" subtitle={doctor ? `د. ${doctor.fullName}` : undefined} back />
      {loading ? <LoadingState /> : null}
      <ErrorBanner message={error} />
      {doctor ? (
        <>
          <GlassCard style={styles.summary}>
            <Text style={styles.doctor}>د. {doctor.fullName}</Text>
            <Text style={styles.meta}>{doctor.specialty} • {formatIqd(doctor.consultationFee)}</Text>
          </GlassCard>
          <SectionTitle title="اختر اليوم" />
          <View style={styles.chips}>
            {availableDates.map((date) => {
              const selected = selectedDate && dateKey(selectedDate) === dateKey(date);
              return (
                <Pressable
                  key={date.toISOString()}
                  onPress={() => {
                    setSelectedDate(date);
                    setSelectedTime('');
                  }}
                  style={[styles.dateChip, selected && styles.selected]}>
                  <Text style={[styles.chipText, selected && styles.selectedText]}>{dayNames[apiDay(date)]}</Text>
                  <Text style={[styles.chipSub, selected && styles.selectedText]}>
                    {date.toLocaleDateString('ar-IQ', { month: 'numeric', day: 'numeric' })}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {selectedDate ? (
            <>
              <SectionTitle title="اختر الوقت" />
              <View style={styles.chips}>
                {times.map((time) => (
                  <Pressable
                    key={time}
                    onPress={() => setSelectedTime(time)}
                    style={[styles.timeChip, selectedTime === time && styles.selected]}>
                    <Text style={[styles.chipText, selectedTime === time && styles.selectedText]}>
                      {time}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
          <GlassCard style={styles.form}>
            <AppInput
              label="رمز الخصم (اختياري)"
              value={discountCode}
              onChangeText={(value) => {
                setDiscountCode(value.toUpperCase());
                setDiscount(null);
              }}
              autoCapitalize="characters"
              error={discountError}
            />
            <PrimaryButton title="تطبيق الرمز" variant="secondary" onPress={validateDiscount} />
            {discount ? <Text style={styles.discount}>تم تطبيق خصم {discount.percentage}%</Text> : null}
            <AppInput
              label="ملاحظات للطبيب (اختياري)"
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </GlassCard>
          <SectionTitle title="طريقة الدفع" />
          <View style={styles.payment}>
            {([
              ['CASH', 'نقدي في العيادة'],
              ['ELECTRONIC', 'دفع إلكتروني'],
            ] as const).map(([value, label]) => (
              <Pressable
                key={value}
                onPress={() => setPaymentMethod(value)}
                style={[styles.paymentOption, paymentMethod === value && styles.selected]}>
                <Text style={[styles.chipText, paymentMethod === value && styles.selectedText]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <GlassCard style={styles.total}>
            <Text style={styles.totalValue}>{formatIqd(total)}</Text>
            <Text style={styles.totalLabel}>المبلغ المستحق</Text>
          </GlassCard>
          <PrimaryButton
            title={paymentMethod === 'ELECTRONIC' ? 'ادفع واحجز' : 'تأكيد الحجز'}
            onPress={confirm}
            loading={submitting}
            disabled={!selectedDate || !selectedTime}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.xs },
  doctor: { color: colors.ink, fontSize: 19, fontWeight: '900', ...rtlText },
  meta: { color: colors.primaryMid, ...rtlText },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  dateChip: { minWidth: 78, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  timeChip: { minWidth: 76, padding: 11, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center' },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.ink, fontWeight: '800', textAlign: 'center' },
  chipSub: { color: colors.inkSoft, fontSize: 12, marginTop: 3 },
  selectedText: { color: colors.white },
  form: { gap: spacing.md },
  discount: { color: colors.success, fontWeight: '800', ...rtlText },
  payment: { flexDirection: 'row-reverse', gap: spacing.sm },
  paymentOption: { flex: 1, minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.ink, fontWeight: '800' },
  totalValue: { color: colors.primaryMid, fontSize: 20, fontWeight: '900' },
});
