import 'package:flutter/foundation.dart';

import '../models/doctor.dart';
import '../services/api_service.dart';

class DoctorsProvider extends ChangeNotifier {
  final ApiService _api = ApiService.instance;

  List<Doctor> _doctors = [];
  bool _loading = false;
  String? _error;
  String _search = '';
  String? _specialtyFilter;

  List<Doctor> get doctors => _doctors;
  bool get loading => _loading;
  String? get error => _error;
  String get search => _search;
  String? get specialtyFilter => _specialtyFilter;

  List<String> get specialties {
    final set = <String>{};
    for (final d in _doctors) {
      if (d.specialty.isNotEmpty) set.add(d.specialty);
    }
    final list = set.toList()..sort();
    return list;
  }

  List<Doctor> get filteredDoctors {
    return _doctors.where((d) {
      final matchesSearch =
          _search.isEmpty ||
          d.fullName.contains(_search) ||
          d.specialty.contains(_search);
      final matchesSpecialty =
          _specialtyFilter == null || d.specialty == _specialtyFilter;
      return matchesSearch && matchesSpecialty;
    }).toList();
  }

  Future<void> load({String? specialty}) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _doctors = await _api.fetchDoctors(specialty: specialty);
      _loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
    } catch (_) {
      _error = 'تعذر تحميل الأطباء';
      _loading = false;
      notifyListeners();
    }
  }

  void setSearch(String value) {
    _search = value.trim();
    notifyListeners();
  }

  void setSpecialtyFilter(String? specialty) {
    _specialtyFilter = specialty;
    notifyListeners();
  }
}
