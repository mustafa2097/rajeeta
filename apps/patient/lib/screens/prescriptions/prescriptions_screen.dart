import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/prescription.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';

class PrescriptionsScreen extends StatefulWidget {
  const PrescriptionsScreen({super.key});

  @override
  State<PrescriptionsScreen> createState() => _PrescriptionsScreenState();
}

class _PrescriptionsScreenState extends State<PrescriptionsScreen> {
  final _api = ApiService.instance;
  List<Prescription> _electronic = [];
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
      final bundle = await _api.fetchMyPrescriptions();
      if (!mounted) return;
      setState(() {
        _electronic = bundle.prescriptions;
        _handwritten = bundle.handwrittenPrescriptions;
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
        _error = 'تعذر تحميل الوصفات';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('yyyy/MM/dd');

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('راجيتاتي')),
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
                  const SectionTitle('الوصفات الإلكترونية'),
                  if (_electronic.isEmpty)
                    const AppCard(child: Text('لا توجد وصفات إلكترونية'))
                  else
                    ..._electronic.map(
                      (p) => AppCard(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.doctor?.fullName ?? 'طبيب',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            if (p.doctor?.specialty != null)
                              Text(
                                p.doctor!.specialty,
                                style: const TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 13,
                                ),
                              ),
                            Text(
                              dateFmt.format(p.createdAt),
                              style: const TextStyle(
                                color: AppColors.inkSoft,
                                fontSize: 12,
                              ),
                            ),
                            const SizedBox(height: 8),
                            ...p.medications.map(
                              (m) => Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Text('• ${m.name} — ${m.dosage}'),
                                    ),
                                    if (m.isRestricted)
                                      const Text(
                                        'مقيد',
                                        style: TextStyle(
                                          color: AppColors.danger,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 12,
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ),
                            if (mNotes(p) != null)
                              Text(
                                mNotes(p)!,
                                style: const TextStyle(
                                  color: AppColors.inkSoft,
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
                            Padding(
                              padding: const EdgeInsets.all(12),
                              child: Text(
                                [
                                  h.doctor?.fullName ?? 'طبيب',
                                  if (h.doctor?.specialty != null)
                                    h.doctor!.specialty,
                                  dateFmt.format(h.createdAt),
                                ].join(' — '),
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

  String? mNotes(Prescription p) =>
      (p.notes != null && p.notes!.isNotEmpty) ? 'ملاحظات: ${p.notes}' : null;
}
