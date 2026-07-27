export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  bloodType?: string | null;
  chronicDiseases: string[];
  labResults?: Record<string, unknown> | null;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  role: Role;
  patientProfile?: PatientProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Doctor {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  specialty: string;
  rating: number;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicFloor?: string | null;
  consultationFee: number;
  subscriptionStatus: string;
  isSubscribed: boolean;
  availabilitySlots?: AvailabilitySlot[];
  matchedSpecialty?: string | null;
}

export interface DoctorHistory {
  conditions: string[];
  appointments: Record<string, unknown>[];
  prescriptions: Record<string, unknown>[];
  handwrittenPrescriptions: Record<string, unknown>[];
}

export interface AppointmentDoctor {
  id: string;
  fullName: string;
  specialty: string;
  clinicName?: string | null;
  clinicAddress?: string | null;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  status: string;
  rejectionMessage?: string | null;
  consultationFee: number;
  discountAmount: number;
  amountPaid: number;
  paymentMethod: string;
  consultationPaymentStatus: string;
  notes?: string | null;
  patientCondition?: string | null;
  doctor?: AppointmentDoctor | null;
}

export interface DiscountValidation {
  code: string;
  percentage: number;
  isActive: boolean;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  instructions?: string | null;
  isRestricted: boolean;
}

export interface PrescriptionDoctor {
  id: string;
  fullName: string;
  specialty: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  notes?: string | null;
  createdAt: string;
  medications: Medication[];
  doctor?: PrescriptionDoctor | null;
}

export interface HandwrittenPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  imageUrl: string;
  notes?: string | null;
  createdAt: string;
  doctor?: PrescriptionDoctor | null;
}

export interface PrescriptionsBundle {
  prescriptions: Prescription[];
  handwrittenPrescriptions: HandwrittenPrescription[];
}

export interface AiSuggestion {
  suggestedSpecialty?: string;
  explanation?: string;
  noExactMatch?: boolean;
  doctors: Doctor[];
}
