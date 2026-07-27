class Medication {
  final String? id;
  final String name;
  final String dosage;
  final String? instructions;
  final bool isRestricted;

  Medication({
    this.id,
    required this.name,
    required this.dosage,
    this.instructions,
    this.isRestricted = false,
  });

  factory Medication.fromJson(Map<String, dynamic> json) {
    return Medication(
      id: json['id'] as String?,
      name: json['name'] as String? ?? '',
      dosage: json['dosage'] as String? ?? '',
      instructions: json['instructions'] as String?,
      isRestricted: json['isRestricted'] as bool? ?? false,
    );
  }
}

class PrescriptionDoctor {
  final String id;
  final String fullName;
  final String specialty;

  PrescriptionDoctor({
    required this.id,
    required this.fullName,
    required this.specialty,
  });

  factory PrescriptionDoctor.fromJson(Map<String, dynamic> json) {
    return PrescriptionDoctor(
      id: json['id'] as String,
      fullName: json['fullName'] as String? ?? '',
      specialty: json['specialty'] as String? ?? '',
    );
  }
}

class Prescription {
  final String id;
  final String appointmentId;
  final String patientId;
  final String doctorId;
  final String? notes;
  final DateTime createdAt;
  final List<Medication> medications;
  final PrescriptionDoctor? doctor;

  Prescription({
    required this.id,
    required this.appointmentId,
    required this.patientId,
    required this.doctorId,
    this.notes,
    required this.createdAt,
    this.medications = const [],
    this.doctor,
  });

  factory Prescription.fromJson(Map<String, dynamic> json) {
    return Prescription(
      id: json['id'] as String,
      appointmentId: json['appointmentId'] as String? ?? '',
      patientId: json['patientId'] as String? ?? '',
      doctorId: json['doctorId'] as String? ?? '',
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      medications:
          (json['medications'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(Medication.fromJson)
              .toList() ??
          const [],
      doctor: json['doctor'] is Map<String, dynamic>
          ? PrescriptionDoctor.fromJson(json['doctor'] as Map<String, dynamic>)
          : null,
    );
  }
}

class HandwrittenPrescription {
  final String id;
  final String patientId;
  final String doctorId;
  final String imageUrl;
  final String? notes;
  final DateTime createdAt;
  final PrescriptionDoctor? doctor;

  HandwrittenPrescription({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.imageUrl,
    this.notes,
    required this.createdAt,
    this.doctor,
  });

  factory HandwrittenPrescription.fromJson(Map<String, dynamic> json) {
    return HandwrittenPrescription(
      id: json['id'] as String,
      patientId: json['patientId'] as String? ?? '',
      doctorId: json['doctorId'] as String? ?? '',
      imageUrl: json['imageUrl'] as String? ?? '',
      notes: json['notes'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
      doctor: json['doctor'] is Map<String, dynamic>
          ? PrescriptionDoctor.fromJson(json['doctor'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PrescriptionsBundle {
  final List<Prescription> prescriptions;
  final List<HandwrittenPrescription> handwrittenPrescriptions;

  PrescriptionsBundle({
    required this.prescriptions,
    required this.handwrittenPrescriptions,
  });

  factory PrescriptionsBundle.fromJson(Map<String, dynamic> json) {
    return PrescriptionsBundle(
      prescriptions:
          (json['prescriptions'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(Prescription.fromJson)
              .toList() ??
          const [],
      handwrittenPrescriptions:
          (json['handwrittenPrescriptions'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(HandwrittenPrescription.fromJson)
              .toList() ??
          const [],
    );
  }
}
