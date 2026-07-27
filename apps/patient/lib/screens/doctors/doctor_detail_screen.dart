import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../navigation/app_routes.dart';
import '../../models/doctor.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import 'book_appointment_screen.dart';

class DoctorDetailScreen extends StatefulWidget {
  final String doctorId;

  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  State<DoctorDetailScreen> createState() => _DoctorDetailScreenState();
}

class _DoctorDetailScreenState extends State<DoctorDetailScreen> {
  final _api = ApiService.instance;
  Doctor? _doctor;
  DoctorHistory? _history;
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
      final patientId = context.read<AuthProvider>().patientProfileId;
      final doctor = await _api.fetchDoctor(widget.doctorId);
      DoctorHistory? history;
      if (patientId != null) {
        history = await _api.fetchDoctorHistory(widget.doctorId, patientId);
      }
      if (!mounted) return;
      setState(() {
        _doctor = doctor;
        _history = history;
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
        _error = 'تعذر تحميل بيانات الطبيب';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('تفاصيل الطبيب')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_error != null || _doctor == null) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: const Text('تفاصيل الطبيب')),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_error ?? 'غير موجود'),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: _load,
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      );
    }

    final doctor = _doctor!;
    final history = _history;
    final dateFmt = DateFormat('yyyy/MM/dd');
    final fee = NumberFormat('#,###').format(doctor.consultationFee);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: Text(doctor.fullName)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          FadeSlideIn(
            child: LiquidGlass(
              margin: EdgeInsets.zero,
              child: Column(
                children: [
                  SpecialtyAvatar(
                    specialty: doctor.specialty,
                    name: doctor.fullName,
                    doctorId: doctor.id,
                    size: 72,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    doctor.fullName,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    doctor.specialty,
                    style: const TextStyle(
                      color: AppColors.accent,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const Divider(height: 28),
                  _row(
                    Icons.star_outline,
                    'التقييم',
                    doctor.rating.toStringAsFixed(1),
                  ),
                  _row(Icons.cake_outlined, 'العمر', '${doctor.age}'),
                  _row(Icons.payments_outlined, 'أجور الكشف', '$fee د.ع'),
                  _row(
                    Icons.local_hospital_outlined,
                    'العيادة',
                    doctor.clinicLabel,
                  ),
                ],
              ),
            ),
          ),
          if (history != null && history.hasHistory) ...[
            const SizedBox(height: 20),
            const Text(
              'سجل الزيارات السابقة',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            const SizedBox(height: 8),
            if (history.conditions.isNotEmpty)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'الحالات السابقة',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    ...history.conditions.map((c) => Text('• $c')),
                  ],
                ),
              ),
            if (history.prescriptions.isNotEmpty)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'الوصفات',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    ...history.prescriptions.map((p) {
                      final meds =
                          (p['medications'] as List<dynamic>?)
                              ?.whereType<Map<String, dynamic>>()
                              .map((m) => m['name']?.toString() ?? '')
                              .where((n) => n.isNotEmpty)
                              .join('، ') ??
                          '';
                      final notes = p['notes']?.toString();
                      return Text(
                        '• ${meds.isEmpty ? (notes ?? 'وصفة') : meds}',
                      );
                    }),
                  ],
                ),
              ),
            if (history.appointments.isNotEmpty)
              AppCard(
                margin: const EdgeInsets.only(bottom: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'ملاحظات الزيارات',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 6),
                    ...history.appointments.map((a) {
                      final notes = a['notes']?.toString();
                      final condition = a['patientCondition']?.toString();
                      final when = a['scheduledAt'] != null
                          ? dateFmt.format(
                              DateTime.parse(
                                a['scheduledAt'] as String,
                              ).toLocal(),
                            )
                          : '';
                      final text = [
                        if (when.isNotEmpty) when,
                        if (condition != null && condition.isNotEmpty)
                          condition,
                        if (notes != null && notes.isNotEmpty) notes,
                      ].join(' — ');
                      return Text('• ${text.isEmpty ? 'زيارة مكتملة' : text}');
                    }),
                  ],
                ),
              ),
          ],
          const SizedBox(height: 20),
          FilledButton.icon(
            onPressed: () {
              Navigator.of(
                context,
              ).push(AppRoutes.mesh(BookAppointmentScreen(doctor: doctor)));
            },
            icon: const Icon(Icons.event_available),
            label: const Text('حجز موعد'),
          ),
        ],
      ),
    );
  }

  Widget _row(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.inkSoft),
          const SizedBox(width: 8),
          Text('$label: ', style: const TextStyle(color: AppColors.inkSoft)),
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
