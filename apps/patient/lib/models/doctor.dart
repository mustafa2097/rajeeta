class AvailabilitySlot {
  final String id;
  final String doctorId;
  final int dayOfWeek;
  final String startTime;
  final String endTime;
  final bool isAvailable;

  AvailabilitySlot({
    required this.id,
    required this.doctorId,
    required this.dayOfWeek,
    required this.startTime,
    required this.endTime,
    required this.isAvailable,
  });

  factory AvailabilitySlot.fromJson(Map<String, dynamic> json) {
    return AvailabilitySlot(
      id: json['id'] as String? ?? '',
      doctorId: json['doctorId'] as String? ?? '',
      dayOfWeek: (json['dayOfWeek'] as num?)?.toInt() ?? 0,
      startTime: json['startTime'] as String? ?? '09:00',
      endTime: json['endTime'] as String? ?? '17:00',
      isAvailable: json['isAvailable'] as bool? ?? true,
    );
  }
}

class Doctor {
  final String id;
  final String userId;
  final String fullName;
  final int age;
  final String specialty;
  final double rating;
  final String? clinicName;
  final String? clinicAddress;
  final String? clinicFloor;
  final int consultationFee;
  final String subscriptionStatus;
  final bool isSubscribed;
  final List<AvailabilitySlot> availabilitySlots;
  final String? matchedSpecialty;

  Doctor({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.age,
    required this.specialty,
    required this.rating,
    this.clinicName,
    this.clinicAddress,
    this.clinicFloor,
    required this.consultationFee,
    required this.subscriptionStatus,
    required this.isSubscribed,
    this.availabilitySlots = const [],
    this.matchedSpecialty,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'] as String,
      userId: json['userId'] as String? ?? '',
      fullName: json['fullName'] as String? ?? '',
      age: (json['age'] as num?)?.toInt() ?? 0,
      specialty: json['specialty'] as String? ?? '',
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      clinicName: json['clinicName'] as String?,
      clinicAddress: json['clinicAddress'] as String?,
      clinicFloor: json['clinicFloor'] as String?,
      consultationFee: (json['consultationFee'] as num?)?.toInt() ?? 0,
      subscriptionStatus: json['subscriptionStatus'] as String? ?? 'NONE',
      isSubscribed: json['isSubscribed'] as bool? ?? false,
      availabilitySlots:
          (json['availabilitySlots'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(AvailabilitySlot.fromJson)
              .toList() ??
          const [],
      matchedSpecialty: json['matchedSpecialty'] as String?,
    );
  }

  String get clinicLabel {
    final parts = <String>[
      if (clinicName != null && clinicName!.isNotEmpty) clinicName!,
      if (clinicAddress != null && clinicAddress!.isNotEmpty) clinicAddress!,
      if (clinicFloor != null && clinicFloor!.isNotEmpty) 'طابق $clinicFloor',
    ];
    return parts.isEmpty ? 'غير محدد' : parts.join(' — ');
  }
}

class DoctorHistory {
  final List<String> conditions;
  final List<Map<String, dynamic>> appointments;
  final List<Map<String, dynamic>> prescriptions;
  final List<Map<String, dynamic>> handwrittenPrescriptions;

  DoctorHistory({
    required this.conditions,
    required this.appointments,
    required this.prescriptions,
    required this.handwrittenPrescriptions,
  });

  factory DoctorHistory.fromJson(Map<String, dynamic> json) {
    return DoctorHistory(
      conditions:
          (json['conditions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      appointments:
          (json['appointments'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .toList() ??
          const [],
      prescriptions:
          (json['prescriptions'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .toList() ??
          const [],
      handwrittenPrescriptions:
          (json['handwrittenPrescriptions'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .toList() ??
          const [],
    );
  }

  bool get hasHistory =>
      conditions.isNotEmpty ||
      appointments.isNotEmpty ||
      prescriptions.isNotEmpty ||
      handwrittenPrescriptions.isNotEmpty;
}
