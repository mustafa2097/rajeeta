import type {
  Appointment,
  AuthResponse,
  AvailabilitySlot,
  Doctor,
  HandwrittenPrescription,
  Medication,
  PatientProfile,
  Prescription,
  PrescriptionsBundle,
  User,
} from '@/types';

const object = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, fallback = '') =>
  typeof value === 'string' ? value : fallback;
const number = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const boolean = (value: unknown, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;
const array = (value: unknown) => (Array.isArray(value) ? value : []);
const optionalText = (value: unknown) => (typeof value === 'string' ? value : null);

export const parsePatientProfile = (value: unknown): PatientProfile => {
  const item = object(value);
  return {
    id: text(item.id),
    userId: text(item.userId),
    fullName: text(item.fullName),
    age: number(item.age),
    bloodType: optionalText(item.bloodType),
    chronicDiseases: array(item.chronicDiseases).map((entry) => text(entry)).filter(Boolean),
    labResults: object(item.labResults),
  };
};

export const parseUser = (value: unknown): User => {
  const item = object(value);
  const role = text(item.role, 'PATIENT');
  return {
    id: text(item.id),
    email: text(item.email),
    phone: text(item.phone),
    role: role === 'DOCTOR' || role === 'ADMIN' ? role : 'PATIENT',
    patientProfile: item.patientProfile ? parsePatientProfile(item.patientProfile) : null,
  };
};

export const parseAuthResponse = (value: unknown): AuthResponse => {
  const item = object(value);
  const accessToken = text(item.accessToken);
  const refreshToken = text(item.refreshToken);
  if (!accessToken || !refreshToken) throw new Error('Invalid authentication response');
  return { accessToken, refreshToken, user: parseUser(item.user) };
};

export const parseAvailability = (value: unknown): AvailabilitySlot => {
  const item = object(value);
  return {
    id: text(item.id),
    doctorId: text(item.doctorId),
    dayOfWeek: number(item.dayOfWeek),
    startTime: text(item.startTime, '09:00'),
    endTime: text(item.endTime, '17:00'),
    isAvailable: boolean(item.isAvailable, true),
  };
};

export const parseDoctor = (value: unknown): Doctor => {
  const item = object(value);
  return {
    id: text(item.id),
    userId: text(item.userId),
    fullName: text(item.fullName),
    age: number(item.age),
    specialty: text(item.specialty),
    rating: number(item.rating),
    clinicName: optionalText(item.clinicName),
    clinicAddress: optionalText(item.clinicAddress),
    clinicFloor: optionalText(item.clinicFloor),
    consultationFee: number(item.consultationFee),
    subscriptionStatus: text(item.subscriptionStatus, 'NONE'),
    isSubscribed: boolean(item.isSubscribed),
    availabilitySlots: array(item.availabilitySlots).map(parseAvailability),
    matchedSpecialty: optionalText(item.matchedSpecialty),
  };
};

export const parseAppointment = (value: unknown): Appointment => {
  const item = object(value);
  const doctor = object(item.doctor);
  return {
    id: text(item.id),
    patientId: text(item.patientId),
    doctorId: text(item.doctorId),
    scheduledAt: text(item.scheduledAt),
    status: text(item.status, 'PENDING'),
    rejectionMessage: optionalText(item.rejectionMessage),
    consultationFee: number(item.consultationFee),
    discountAmount: number(item.discountAmount),
    amountPaid: number(item.amountPaid),
    paymentMethod: text(item.paymentMethod, 'CASH'),
    consultationPaymentStatus: text(item.consultationPaymentStatus, 'NOT_REQUIRED'),
    notes: optionalText(item.notes),
    patientCondition: optionalText(item.patientCondition),
    doctor: item.doctor
      ? {
          id: text(doctor.id),
          fullName: text(doctor.fullName),
          specialty: text(doctor.specialty),
          clinicName: optionalText(doctor.clinicName),
          clinicAddress: optionalText(doctor.clinicAddress),
        }
      : null,
  };
};

const parseMedication = (value: unknown): Medication => {
  const item = object(value);
  return {
    id: optionalText(item.id) ?? undefined,
    name: text(item.name),
    dosage: text(item.dosage),
    instructions: optionalText(item.instructions),
    isRestricted: boolean(item.isRestricted),
  };
};

const parsePrescription = (value: unknown): Prescription => {
  const item = object(value);
  const doctor = object(item.doctor);
  return {
    id: text(item.id),
    appointmentId: text(item.appointmentId),
    patientId: text(item.patientId),
    doctorId: text(item.doctorId),
    notes: optionalText(item.notes),
    createdAt: text(item.createdAt),
    medications: array(item.medications).map(parseMedication),
    doctor: item.doctor
      ? { id: text(doctor.id), fullName: text(doctor.fullName), specialty: text(doctor.specialty) }
      : null,
  };
};

const parseHandwritten = (value: unknown): HandwrittenPrescription => {
  const item = object(value);
  const doctor = object(item.doctor);
  return {
    id: text(item.id),
    patientId: text(item.patientId),
    doctorId: text(item.doctorId),
    imageUrl: text(item.imageUrl),
    notes: optionalText(item.notes),
    createdAt: text(item.createdAt),
    doctor: item.doctor
      ? { id: text(doctor.id), fullName: text(doctor.fullName), specialty: text(doctor.specialty) }
      : null,
  };
};

export const parsePrescriptions = (value: unknown): PrescriptionsBundle => {
  const item = object(value);
  return {
    prescriptions: array(item.prescriptions).map(parsePrescription),
    handwrittenPrescriptions: array(item.handwrittenPrescriptions).map(parseHandwritten),
  };
};
