import 'package:flutter/foundation.dart';

import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  bool _loading = true;
  bool _busy = false;
  String? _error;
  User? _user;

  bool get loading => _loading;
  bool get busy => _busy;
  String? get error => _error;
  User? get user => _user;
  bool get isAuthenticated => _user != null && _api.isAuthenticated;
  String? get patientProfileId => _user?.patientProfileId;

  Future<void> init() async {
    _loading = true;
    notifyListeners();
    await _api.init();
    _user = _api.currentUser;
    if (_user != null) {
      try {
        _user = await _api.fetchMe();
      } catch (_) {
        // Keep cached user; token refresh will run on next request.
      }
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> login(String identifier, String password) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final auth = await _api.login(identifier.trim(), password);
      _user = auth.user;
      _busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _busy = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'تعذر الاتصال بالخادم';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String phone,
    required String password,
    required String fullName,
    required int age,
    String? bloodType,
    List<String>? chronicDiseases,
  }) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      final auth = await _api.registerPatient(
        email: email.trim(),
        phone: phone.trim(),
        password: password,
        fullName: fullName.trim(),
        age: age,
        bloodType: bloodType,
        chronicDiseases: chronicDiseases,
      );
      _user = auth.user;
      _busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _busy = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'تعذر الاتصال بالخادم';
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    await _api.clearAuth();
    _user = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
