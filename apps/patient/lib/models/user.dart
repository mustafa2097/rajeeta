class PatientProfile {
  final String id;
  final String userId;
  final String fullName;
  final int age;
  final String? bloodType;
  final List<String> chronicDiseases;
  final Map<String, dynamic>? labResults;

  PatientProfile({
    required this.id,
    required this.userId,
    required this.fullName,
    required this.age,
    this.bloodType,
    this.chronicDiseases = const [],
    this.labResults,
  });

  factory PatientProfile.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic>? labs;
    final rawLabs = json['labResults'];
    if (rawLabs is Map<String, dynamic>) {
      labs = rawLabs;
    }

    return PatientProfile(
      id: json['id'] as String,
      userId: json['userId'] as String,
      fullName: json['fullName'] as String? ?? '',
      age: (json['age'] as num?)?.toInt() ?? 0,
      bloodType: json['bloodType'] as String?,
      chronicDiseases:
          (json['chronicDiseases'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      labResults: labs,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'userId': userId,
    'fullName': fullName,
    'age': age,
    'bloodType': bloodType,
    'chronicDiseases': chronicDiseases,
    'labResults': labResults,
  };
}

class User {
  final String id;
  final String email;
  final String phone;
  final String role;
  final PatientProfile? patientProfile;

  User({
    required this.id,
    required this.email,
    required this.phone,
    required this.role,
    this.patientProfile,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      role: json['role'] as String? ?? 'PATIENT',
      patientProfile: json['patientProfile'] is Map<String, dynamic>
          ? PatientProfile.fromJson(
              json['patientProfile'] as Map<String, dynamic>,
            )
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'phone': phone,
    'role': role,
    'patientProfile': patientProfile?.toJson(),
  };

  String get displayName => patientProfile?.fullName ?? email;
  String? get patientProfileId => patientProfile?.id;
}

class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final User user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      user: User.fromJson(json['user'] as Map<String, dynamic>),
    );
  }
}
