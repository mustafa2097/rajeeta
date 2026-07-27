class AppointmentDoctor {
  final String id;
  final String fullName;
  final String specialty;
  final String? clinicName;
  final String? clinicAddress;

  AppointmentDoctor({
    required this.id,
    required this.fullName,
    required this.specialty,
    this.clinicName,
    this.clinicAddress,
  });

  factory AppointmentDoctor.fromJson(Map<String, dynamic> json) {
    return AppointmentDoctor(
      id: json['id'] as String,
      fullName: json['fullName'] as String? ?? '',
      specialty: json['specialty'] as String? ?? '',
      clinicName: json['clinicName'] as String?,
      clinicAddress: json['clinicAddress'] as String?,
    );
  }
}

class Appointment {
  final String id;
  final String patientId;
  final String doctorId;
  final DateTime scheduledAt;
  final String status;
  final String? rejectionMessage;
  final int consultationFee;
  final int discountAmount;
  final int amountPaid;
  final String paymentMethod;
  final String consultationPaymentStatus;
  final String? notes;
  final String? patientCondition;
  final AppointmentDoctor? doctor;

  Appointment({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.scheduledAt,
    required this.status,
    this.rejectionMessage,
    required this.consultationFee,
    required this.discountAmount,
    required this.amountPaid,
    this.paymentMethod = 'CASH',
    this.consultationPaymentStatus = 'NOT_REQUIRED',
    this.notes,
    this.patientCondition,
    this.doctor,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'] as String,
      patientId: json['patientId'] as String? ?? '',
      doctorId: json['doctorId'] as String? ?? '',
      scheduledAt: DateTime.parse(json['scheduledAt'] as String).toLocal(),
      status: json['status'] as String? ?? 'PENDING',
      rejectionMessage: json['rejectionMessage'] as String?,
      consultationFee: (json['consultationFee'] as num?)?.toInt() ?? 0,
      discountAmount: (json['discountAmount'] as num?)?.toInt() ?? 0,
      amountPaid: (json['amountPaid'] as num?)?.toInt() ?? 0,
      paymentMethod: json['paymentMethod'] as String? ?? 'CASH',
      consultationPaymentStatus:
          json['consultationPaymentStatus'] as String? ?? 'NOT_REQUIRED',
      notes: json['notes'] as String?,
      patientCondition: json['patientCondition'] as String?,
      doctor: json['doctor'] is Map<String, dynamic>
          ? AppointmentDoctor.fromJson(json['doctor'] as Map<String, dynamic>)
          : null,
    );
  }

  String get statusLabel {
    switch (status) {
      case 'PENDING':
        return 'قيد الانتظار';
      case 'CONFIRMED':
        return 'مؤكد';
      case 'REJECTED':
        return 'مرفوض';
      case 'COMPLETED':
        return 'مكتمل';
      case 'CANCELLED':
        return 'ملغى';
      default:
        return status;
    }
  }

  String get paymentMethodLabel {
    switch (paymentMethod) {
      case 'ELECTRONIC':
        return 'دفع إلكتروني';
      default:
        return 'نقدي في العيادة';
    }
  }
}

class DiscountValidation {
  final String code;
  final int percentage;
  final bool isActive;

  DiscountValidation({
    required this.code,
    required this.percentage,
    required this.isActive,
  });

  factory DiscountValidation.fromJson(Map<String, dynamic> json) {
    return DiscountValidation(
      code: json['code'] as String,
      percentage: (json['percentage'] as num?)?.toInt() ?? 0,
      isActive: json['isActive'] as bool? ?? false,
    );
  }
}
