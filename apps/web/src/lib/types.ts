export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export type SubscriptionStatus = 'NONE' | 'TRIAL' | 'ACTIVE' | 'EXPIRED';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface DoctorProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  specialty: string;
  rating?: number;
  clinicName?: string | null;
  clinicAddress?: string | null;
  clinicFloor?: string | null;
  consultationFee: number;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt?: string | null;
  subscriptionEndsAt?: string | null;
  wallet?: Wallet | null;
}

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  bloodType?: string | null;
  chronicDiseases?: string[];
  labResults?: Record<string, unknown> | null;
  user?: {
    id: string;
    email: string;
    phone: string;
    role: Role;
  };
  appointments?: Appointment[];
  prescriptions?: Prescription[];
  handwrittenPrescriptions?: HandwrittenPrescription[];
}

export interface AdminProfile {
  id: string;
  userId: string;
  fullName: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  role: Role;
  createdAt?: string;
  doctorProfile?: DoctorProfile | null;
  patientProfile?: PatientProfile | null;
  adminProfile?: AdminProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Medication {
  id?: string;
  name: string;
  dosage: string;
  instructions?: string;
  isRestricted: boolean;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  notes?: string | null;
  createdAt: string;
  medications: Medication[];
}

export interface HandwrittenPrescription {
  id: string;
  patientId: string;
  doctorId: string;
  imageUrl: string;
  notes?: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  status: AppointmentStatus;
  rejectionMessage?: string | null;
  consultationFee: number;
  discountAmount: number;
  amountPaid: number;
  paymentMethod?: 'CASH' | 'ELECTRONIC';
  consultationPaymentStatus?: string;
  notes?: string | null;
  patientCondition?: string | null;
  patient?: Pick<
    PatientProfile,
    'id' | 'fullName' | 'age' | 'bloodType' | 'chronicDiseases'
  >;
  prescription?: Prescription | null;
  discountCode?: DiscountCode | null;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  amount: number;
  type: string;
  description?: string | null;
  appointmentId?: string | null;
  createdAt: string;
}

export interface Wallet {
  id: string;
  doctorId: string;
  balance: number;
  totalEarnings?: number;
  withdrawableBalance?: number;
  transactions?: WalletTransaction[];
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  reference?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    role: Role;
    doctorProfile?: { fullName: string } | null;
  };
}

export interface DiscountCode {
  id: string;
  code: string;
  percentage: number;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

export interface AdminStats {
  counts: {
    patients: number;
    doctors: number;
    admins: number;
    prescriptions: number;
    appointments: Record<string, number>;
  };
  revenue: {
    total: number;
    byType: Record<string, number>;
    walletCredits: number;
    walletDebits: number;
  };
}

export interface AdminTransactions {
  walletTransactions: Array<
    WalletTransaction & {
      wallet?: {
        doctor?: { id: string; fullName: string };
      };
      appointment?: {
        id: string;
        scheduledAt: string;
        status: AppointmentStatus;
      } | null;
      discountCode?: DiscountCode | null;
    }
  >;
  payments: Payment[];
}
