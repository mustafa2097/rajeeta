import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/appointment.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import '../../widgets/status_badge.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
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
        _error = 'تعذر تحميل الإشعارات';
        _loading = false;
      });
    }
  }

  String _message(Appointment a) {
    final doctor = a.doctor?.fullName ?? 'الطبيب';
    switch (a.status) {
      case 'PENDING':
        return 'طلب موعدك مع $doctor قيد الانتظار';
      case 'CONFIRMED':
        return 'تم تأكيد موعدك مع $doctor';
      case 'REJECTED':
        return a.rejectionMessage != null && a.rejectionMessage!.isNotEmpty
            ? 'رُفض موعدك مع $doctor: ${a.rejectionMessage}'
            : 'رُفض موعدك مع $doctor';
      case 'COMPLETED':
        return 'اكتملت زيارتك مع $doctor';
      case 'CANCELLED':
        return 'تم إلغاء موعدك مع $doctor';
      default:
        return 'تحديث على موعدك مع $doctor';
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateFmt = DateFormat('yyyy/MM/dd — HH:mm');

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('الإشعارات'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_rounded),
          onPressed: () => Navigator.pop(context),
        ),
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
              color: AppColors.primary,
              onRefresh: _load,
              child: _items.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 80),
                        EmptyState(
                          icon: Icons.notifications_none_rounded,
                          title: 'لا توجد إشعارات',
                          subtitle: 'ستظهر هنا تحديثات مواعيدك',
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final a = _items[index];
                        return FadeSlideIn(
                          index: index,
                          child: LiquidGlass(
                            margin: const EdgeInsets.only(bottom: 10),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        _message(a),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w700,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ),
                                    StatusBadge(
                                      status: a.status,
                                      label: a.statusLabel,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  dateFmt.format(a.scheduledAt),
                                  style: const TextStyle(
                                    color: AppColors.inkSoft,
                                    fontSize: 12.5,
                                  ),
                                ),
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
