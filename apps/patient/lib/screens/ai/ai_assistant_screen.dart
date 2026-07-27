import 'package:flutter/material.dart';

import '../../navigation/app_routes.dart';
import '../../models/doctor.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/doctor_card.dart';
import '../../widgets/glass.dart';
import '../doctors/doctor_detail_screen.dart';

class AiAssistantScreen extends StatefulWidget {
  const AiAssistantScreen({super.key});

  @override
  State<AiAssistantScreen> createState() => _AiAssistantScreenState();
}

class _AiAssistantScreenState extends State<AiAssistantScreen> {
  final _api = ApiService.instance;
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;
  String? _suggestedSpecialty;
  String? _explanation;
  bool _noExactMatch = false;
  List<Doctor> _doctors = [];

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final diagnosis = _controller.text.trim();
    if (diagnosis.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('اكتب وصفاً للحالة أو التشخيص')),
      );
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final result = await _api.suggestDoctors(diagnosis);
      final doctors =
          (result['doctors'] as List<dynamic>?)
              ?.whereType<Map<String, dynamic>>()
              .map(Doctor.fromJson)
              .toList() ??
          [];
      if (!mounted) return;
      setState(() {
        _doctors = doctors;
        _suggestedSpecialty = result['suggestedSpecialty'] as String?;
        _explanation = result['explanation'] as String?;
        _noExactMatch = result['noExactMatch'] as bool? ?? false;
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
        _error = 'تعذر الحصول على اقتراحات';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final top = MediaQuery.paddingOf(context).top;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.fromLTRB(16, top + 12, 16, 20),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
                colors: AppColors.brandGradient,
              ),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.14),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(
                        Icons.auto_awesome_rounded,
                        color: Colors.white,
                        size: 22,
                      ),
                    ),
                    const SizedBox(width: 10),
                    const Expanded(
                      child: Text(
                        'المساعد الذكي',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 20,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'اكتب أعراضك أو تشخيصك — نقترح التخصص والأطباء المناسبين',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.88),
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: FadeSlideIn(
                    child: LiquidGlass(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TextField(
                            controller: _controller,
                            maxLines: 3,
                            decoration: const InputDecoration(
                              labelText: 'التشخيص أو الأعراض',
                              hintText: 'مثال: ألم في الصدر، طفح جلدي...',
                            ),
                          ),
                          const SizedBox(height: 12),
                          SizedBox(
                            width: double.infinity,
                            child: FilledButton.icon(
                              onPressed: _loading ? null : _submit,
                              icon: _loading
                                  ? const SizedBox(
                                      width: 18,
                                      height: 18,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.auto_awesome_rounded),
                              label: Text(
                                _loading ? 'جاري التحليل...' : 'اقترح أطباء',
                              ),
                            ),
                          ),
                          if (_suggestedSpecialty != null) ...[
                            const SizedBox(height: 12),
                            LiquidGlass(
                              blur: 2,
                              opacity: 0.9,
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _explanation ??
                                        'التخصص المقترح: $_suggestedSpecialty',
                                    style: const TextStyle(
                                      color: AppColors.ink,
                                      fontWeight: FontWeight.w700,
                                      height: 1.4,
                                    ),
                                  ),
                                  if (_noExactMatch) ...[
                                    const SizedBox(height: 6),
                                    const Text(
                                      'لم نجد تطابقاً دقيقاً — هذه أقرب النتائج',
                                      style: TextStyle(
                                        color: AppColors.warning,
                                        fontSize: 12.5,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                          if (_error != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              _error!,
                              style: const TextStyle(color: AppColors.danger),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: _doctors.isEmpty
                      ? const EmptyState(
                          icon: Icons.medical_information_outlined,
                          title: 'ستظهر اقتراحات الأطباء هنا',
                        )
                      : ListView.builder(
                          itemCount: _doctors.length,
                          itemBuilder: (context, index) {
                            final doctor = _doctors[index];
                            return DoctorCard(
                              doctor: doctor,
                              onTap: () {
                                Navigator.of(context).push(
                                  AppRoutes.mesh(
                                    DoctorDetailScreen(doctorId: doctor.id),
                                  ),
                                );
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
