import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/appointment.dart';
import '../../models/prescription.dart';
import '../../models/user.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _api = ApiService.instance;
  PatientProfile? _profile;
  List<Appointment> _appointments = [];
  List<HandwrittenPrescription> _handwritten = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _api.fetchPatientProfile(),
        _api.fetchMyAppointments(),
        _api.fetchMyPrescriptions(),
      ]);
      if (!mounted) return;
      setState(() {
        _profile = results[0] as PatientProfile;
        _appointments = results[1] as List<Appointment>;
        _handwritten =
            (results[2] as PrescriptionsBundle).handwrittenPrescriptions;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'تعذر تحميل الملف الشخصي';
        _loading = false;
      });
    }
  }

  List<AppointmentDoctor> get _visitedDoctors {
    final map = <String, AppointmentDoctor>{};
    for (final a in _appointments) {
      if (a.doctor != null) map[a.doctor!.id] = a.doctor!;
    }
    return map.values.toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final name = _profile?.fullName ?? auth.user?.displayName ?? '';

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('حسابي'),
        actions: [
          IconButton(
            tooltip: 'تسجيل الخروج',
            onPressed: () async => auth.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_error!),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: _load,
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(0, 8, 0, 100),
                children: [
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _line('العمر', '${_profile?.age ?? '-'}'),
                        _line(
                          'فصيلة الدم',
                          _profile?.bloodType?.isNotEmpty == true
                              ? _profile!.bloodType!
                              : 'غير محددة',
                        ),
                        _line(
                          'الأمراض المزمنة',
                          (_profile?.chronicDiseases.isNotEmpty == true)
                              ? _profile!.chronicDiseases.join('، ')
                              : 'لا يوجد',
                        ),
                        if (auth.user != null) ...[
                          _line('البريد', auth.user!.email),
                          _line('الهاتف', auth.user!.phone),
                        ],
                      ],
                    ),
                  ),
                  const SectionTitle('نتائج المختبر'),
                  AppCard(
                    child:
                        _profile?.labResults == null ||
                            _profile!.labResults!.isEmpty
                        ? const Text('لا توجد نتائج مختبر')
                        : Column(
                            children: _profile!.labResults!.entries
                                .map(
                                  (e) => Padding(
                                    padding: const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      children: [
                                        Expanded(child: Text(e.key)),
                                        Text(
                                          '${e.value}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                  ),
                  const SectionTitle('الأطباء الذين زرتهم'),
                  if (_visitedDoctors.isEmpty)
                    const AppCard(child: Text('لا توجد زيارات بعد'))
                  else
                    ..._visitedDoctors.map(
                      (d) => AppCard(
                        child: Row(
                          children: [
                            SpecialtyAvatar(
                              specialty: d.specialty,
                              name: d.fullName,
                              doctorId: d.id,
                              size: 40,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    d.fullName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  Text(
                                    d.specialty,
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SectionTitle('الوصفات الخطية'),
                  if (_handwritten.isEmpty)
                    const AppCard(child: Text('لا توجد وصفات خطية'))
                  else
                    ..._handwritten.map((h) {
                      final url = _api.resolveUploadUrl(h.imageUrl);
                      return AppCard(
                        padding: EdgeInsets.zero,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (h.doctor != null)
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Text(
                                  '${h.doctor!.fullName} — ${h.doctor!.specialty}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            AspectRatio(
                              aspectRatio: 4 / 3,
                              child: Image.network(
                                url,
                                fit: BoxFit.cover,
                                errorBuilder: (_, _, _) => const Center(
                                  child: Icon(Icons.broken_image, size: 40),
                                ),
                              ),
                            ),
                            if (h.notes != null && h.notes!.isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.all(12),
                                child: Text(h.notes!),
                              ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }

  Widget _line(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.inkSoft),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
