import 'dart:async';
import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';
import '../models/appointment.dart';
import '../models/doctor.dart';
import '../models/prescription.dart';
import '../models/user.dart';

class ApiException implements Exception {
  final String message;
  final int status;

  ApiException(this.message, this.status);

  @override
  String toString() => message;
}

class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();

  static const _accessKey = 'accessToken';
  static const _refreshKey = 'refreshToken';
  static const _userKey = 'user';
  static const _requestTimeout = Duration(seconds: 20);
  static const _storage = FlutterSecureStorage();

  String? _accessToken;
  String? _refreshToken;
  User? _user;
  Future<AuthResponse?>? _refreshInFlight;

  User? get currentUser => _user;
  bool get isAuthenticated => _accessToken != null && _user != null;

  Future<void> init() async {
    _accessToken = await _storage.read(key: _accessKey);
    _refreshToken = await _storage.read(key: _refreshKey);
    final rawUser = await _storage.read(key: _userKey);
    if (rawUser != null) {
      try {
        _user = User.fromJson(jsonDecode(rawUser) as Map<String, dynamic>);
      } catch (_) {
        _user = null;
      }
    }
  }

  Future<void> _persistAuth(AuthResponse auth) async {
    _accessToken = auth.accessToken;
    _refreshToken = auth.refreshToken;
    _user = auth.user;
    await Future.wait([
      _storage.write(key: _accessKey, value: auth.accessToken),
      _storage.write(key: _refreshKey, value: auth.refreshToken),
      _storage.write(key: _userKey, value: jsonEncode(auth.user.toJson())),
    ]);
  }

  Future<void> clearAuth() async {
    _accessToken = null;
    _refreshToken = null;
    _user = null;
    await Future.wait([
      _storage.delete(key: _accessKey),
      _storage.delete(key: _refreshKey),
      _storage.delete(key: _userKey),
    ]);
  }

  String _extractError(dynamic data, String fallback) {
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is List) return message.join('، ');
      if (message is String) return message;
    }
    return fallback;
  }

  Future<AuthResponse?> _refreshTokens() async {
    if (_refreshToken == null) return null;
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': _refreshToken}),
      ).timeout(_requestTimeout);
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final auth = AuthResponse.fromJson(
          jsonDecode(response.body) as Map<String, dynamic>,
        );
        await _persistAuth(auth);
        return auth;
      }
      await clearAuth();
      return null;
    } on TimeoutException {
      throw ApiException('انتهت مهلة الاتصال بالخادم، حاول مجدداً', 408);
    } catch (_) {
      await clearAuth();
      return null;
    }
  }

  Future<AuthResponse?> _ensureFreshTokens() {
    _refreshInFlight ??= _refreshTokens().whenComplete(() {
      _refreshInFlight = null;
    });
    return _refreshInFlight!;
  }

  Future<dynamic> request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? body,
    bool auth = true,
  }) async {
    Future<http.Response> send(String? token) {
      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (auth && token != null) 'Authorization': 'Bearer $token',
      };
      final uri = Uri.parse('${ApiConfig.baseUrl}$path');
      final encoded = body == null ? null : jsonEncode(body);
      switch (method) {
        case 'POST':
          return http
              .post(uri, headers: headers, body: encoded)
              .timeout(_requestTimeout);
        case 'PATCH':
          return http
              .patch(uri, headers: headers, body: encoded)
              .timeout(_requestTimeout);
        case 'PUT':
          return http
              .put(uri, headers: headers, body: encoded)
              .timeout(_requestTimeout);
        case 'DELETE':
          return http.delete(uri, headers: headers).timeout(_requestTimeout);
        default:
          return http.get(uri, headers: headers).timeout(_requestTimeout);
      }
    }

    late http.Response response;
    try {
      response = await send(_accessToken);
    } on TimeoutException {
      throw ApiException('انتهت مهلة الاتصال بالخادم، حاول مجدداً', 408);
    }

    if (response.statusCode == 401 && auth) {
      final refreshed = await _ensureFreshTokens();
      if (refreshed?.accessToken != null) {
        try {
          response = await send(refreshed!.accessToken);
        } on TimeoutException {
          throw ApiException('انتهت مهلة الاتصال بالخادم، حاول مجدداً', 408);
        }
      } else {
        await clearAuth();
        throw ApiException('انتهت الجلسة، يرجى تسجيل الدخول مجدداً', 401);
      }
    }

    if (response.statusCode == 204) return null;

    dynamic data;
    try {
      data = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      data = null;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        _extractError(data, 'حدث خطأ غير متوقع'),
        response.statusCode,
      );
    }

    return data;
  }

  Future<AuthResponse> login(String identifier, String password) async {
    final data = await request(
      '/auth/login',
      method: 'POST',
      auth: false,
      body: {'identifier': identifier, 'password': password},
    );
    final auth = AuthResponse.fromJson(data as Map<String, dynamic>);
    await _persistAuth(auth);
    return auth;
  }

  Future<AuthResponse> registerPatient({
    required String email,
    required String phone,
    required String password,
    required String fullName,
    required int age,
    String? bloodType,
    List<String>? chronicDiseases,
  }) async {
    final data = await request(
      '/auth/register/patient',
      method: 'POST',
      auth: false,
      body: {
        'email': email,
        'phone': phone,
        'password': password,
        'fullName': fullName,
        'age': age,
        if (bloodType != null && bloodType.isNotEmpty) 'bloodType': bloodType,
        'chronicDiseases': ?chronicDiseases,
      },
    );
    final auth = AuthResponse.fromJson(data as Map<String, dynamic>);
    await _persistAuth(auth);
    return auth;
  }

  Future<User> fetchMe() async {
    final data = await request('/auth/me');
    final user = User.fromJson(data as Map<String, dynamic>);
    _user = user;
    await _storage.write(key: _userKey, value: jsonEncode(user.toJson()));
    return user;
  }

  Future<void> deleteAccount() async {
    await request('/auth/account', method: 'DELETE');
    await clearAuth();
  }

  Future<PatientProfile> fetchPatientProfile() async {
    final data = await request('/patients/me');
    return PatientProfile.fromJson(data as Map<String, dynamic>);
  }

  Future<List<Doctor>> fetchDoctors({String? specialty}) async {
    final query = specialty != null && specialty.isNotEmpty
        ? '?specialty=${Uri.encodeQueryComponent(specialty)}'
        : '';
    final data = await request('/doctors$query', auth: false);
    return (data as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Doctor.fromJson)
        .toList();
  }

  Future<Doctor> fetchDoctor(String id) async {
    final data = await request('/doctors/$id', auth: false);
    return Doctor.fromJson(data as Map<String, dynamic>);
  }

  Future<DoctorHistory?> fetchDoctorHistory(
    String doctorId,
    String patientId,
  ) async {
    try {
      final data = await request('/doctors/$doctorId/history/$patientId');
      return DoctorHistory.fromJson(data as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.status == 403 || e.status == 404) return null;
      rethrow;
    }
  }

  Future<List<AvailabilitySlot>> fetchAvailability(String doctorId) async {
    final data = await request('/availability/$doctorId', auth: false);
    return (data as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(AvailabilitySlot.fromJson)
        .toList();
  }

  Future<DiscountValidation> validateDiscount(String code) async {
    final data = await request(
      '/discount-codes/validate/${Uri.encodeComponent(code)}',
      auth: false,
    );
    return DiscountValidation.fromJson(data as Map<String, dynamic>);
  }

  Future<Appointment> createAppointment({
    required String doctorId,
    required DateTime scheduledAt,
    String? discountCode,
    String? notes,
    String paymentMethod = 'CASH',
  }) async {
    final data = await request(
      '/appointments',
      method: 'POST',
      body: {
        'doctorId': doctorId,
        'scheduledAt': scheduledAt.toUtc().toIso8601String(),
        if (discountCode != null && discountCode.isNotEmpty)
          'discountCode': discountCode,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'paymentMethod': paymentMethod,
      },
    );
    return Appointment.fromJson(data as Map<String, dynamic>);
  }

  Future<void> payConsultation(String appointmentId) async {
    await request(
      '/payments/consultation',
      method: 'POST',
      body: {'appointmentId': appointmentId},
    );
  }

  Future<List<Appointment>> fetchMyAppointments() async {
    final data = await request('/appointments/mine');
    return (data as List<dynamic>)
        .whereType<Map<String, dynamic>>()
        .map(Appointment.fromJson)
        .toList();
  }

  Future<PrescriptionsBundle> fetchMyPrescriptions() async {
    final data = await request('/prescriptions/mine');
    return PrescriptionsBundle.fromJson(data as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> suggestDoctors(String diagnosis) async {
    final data = await request(
      '/ai/suggest-doctors',
      method: 'POST',
      auth: false,
      body: {'diagnosis': diagnosis},
    );
    return data as Map<String, dynamic>;
  }

  String resolveUploadUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    if (path.startsWith('/')) {
      return '${ApiConfig.uploadsBase}$path';
    }
    return '${ApiConfig.uploadsBase}/$path';
  }
}
