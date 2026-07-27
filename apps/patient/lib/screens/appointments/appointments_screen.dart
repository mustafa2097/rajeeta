import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/appointment.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import '../../widgets/status_badge.dart';

class AppointmentsScreen extends StatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  State<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends State<AppointmentsScreen> {
  final _api = ApiService.instance;
  List<Appointment> _items = [];
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
      final items = await _api.fetchMyAppointments();
      if (!mounted) return;
      setState(() {
        _items = items;
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
        _error = 'تعذر تحميل المواعيد';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('yyyy/MM/dd — HH:mm');

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('مواعيدي')),
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
              child: _items.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          icon: Icons.calendar_month_outlined,
                          title: 'لا توجد مواعيد',
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(0, 8, 0, 100),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final a = _items[index];
                        final statusLabel =
                            a.status == 'REJECTED' &&
                                a.rejectionMessage != null &&
                                a.rejectionMessage!.isNotEmpty
                            ? 'مرفوض'
                            : a.statusLabel;

                        return FadeSlideIn(
                          index: index,
                          child: LiquidGlass(
                            margin: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 6,
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        a.doctor?.fullName ?? 'طبيب',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ),
                                    StatusBadge(
                                      status: a.status,
                                      label: statusLabel,
                                    ),
                                  ],
                                ),
                                if (a.doctor?.specialty != null) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    a.doctor!.specialty,
                                    style: const TextStyle(
                                      color: AppColors.primary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                                const SizedBox(height: 8),
                                Text(
                                  dateFmt.format(a.scheduledAt),
                                  style: const TextStyle(
                                    color: AppColors.inkSoft,
                                    fontSize: 13,
                                  ),
                                ),
                                Text(
                                  'المبلغ: ${a.amountPaid} د.ع · ${a.paymentMethodLabel}',
                                  style: const TextStyle(fontSize: 13),
                                ),
                                if (a.status == 'REJECTED' &&
                                    a.rejectionMessage != null &&
                                    a.rejectionMessage!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Text(
                                    'سبب الرفض: ${a.rejectionMessage}',
                                    style: const TextStyle(
                                      color: AppColors.danger,
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                                if (a.patientCondition != null &&
                                    a.patientCondition!.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text('الحالة: ${a.patientCondition}'),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
