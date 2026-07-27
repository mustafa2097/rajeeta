import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../models/appointment.dart';
import '../../models/doctor.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';

const _dayNames = [
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
  'الأحد',
];

class BookAppointmentScreen extends StatefulWidget {
  final Doctor doctor;

  const BookAppointmentScreen({super.key, required this.doctor});

  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  final _api = ApiService.instance;
  final _discountController = TextEditingController();
  final _notesController = TextEditingController();

  List<AvailabilitySlot> _slots = [];
  bool _loading = true;
  bool _submitting = false;
  String? _error;

  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  DiscountValidation? _discount;
  String? _discountError;
  String _paymentMethod = 'CASH';

  @override
  void initState() {
    super.initState();
    _loadSlots();
  }

  @override
  void dispose() {
    _discountController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadSlots() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final slots = widget.doctor.availabilitySlots.isNotEmpty
          ? widget.doctor.availabilitySlots
          : await _api.fetchAvailability(widget.doctor.id);
      if (!mounted) return;
      setState(() {
        _slots = slots.where((s) => s.isAvailable).toList();
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
        _error = 'تعذر تحميل المواعيد المتاحة';
        _loading = false;
      });
    }
  }

  int _apiDayOfWeek(DateTime date) => date.weekday - 1;

  List<DateTime> get _availableDates {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final availableDays = _slots.map((s) => s.dayOfWeek).toSet();
    final dates = <DateTime>[];
    for (var i = 0; i < 14; i++) {
      final d = today.add(Duration(days: i));
      if (availableDays.contains(_apiDayOfWeek(d))) dates.add(d);
    }
    return dates;
  }

  List<TimeOfDay> get _timeOptions {
    if (_selectedDate == null) return [];
    final day = _apiDayOfWeek(_selectedDate!);
    final daySlots = _slots.where((s) => s.dayOfWeek == day);
    final times = <TimeOfDay>{};
    for (final slot in daySlots) {
      final start = _parseTime(slot.startTime);
      final end = _parseTime(slot.endTime);
      var minutes = start.hour * 60 + start.minute;
      final endMinutes = end.hour * 60 + end.minute;
      while (minutes + 30 <= endMinutes) {
        times.add(TimeOfDay(hour: minutes ~/ 60, minute: minutes % 60));
        minutes += 30;
      }
    }
    final list = times.toList()
      ..sort(
        (a, b) => (a.hour * 60 + a.minute).compareTo(b.hour * 60 + b.minute),
      );

    final now = DateTime.now();
    if (_selectedDate!.year == now.year &&
        _selectedDate!.month == now.month &&
        _selectedDate!.day == now.day) {
      final nowMinutes = now.hour * 60 + now.minute;
      return list.where((t) => t.hour * 60 + t.minute > nowMinutes).toList();
    }
    return list;
  }

  TimeOfDay _parseTime(String value) {
    final parts = value.split(':');
    return TimeOfDay(
      hour: int.parse(parts[0]),
      minute: int.parse(parts.length > 1 ? parts[1] : '0'),
    );
  }

  int get _feeAfterDiscount {
    final fee = widget.doctor.consultationFee;
    final pct = _discount?.percentage ?? 0;
    return (fee - (fee * pct / 100)).round();
  }

  Future<void> _validateDiscount() async {
    final code = _discountController.text.trim();
    if (code.isEmpty) {
      setState(() {
        _discount = null;
        _discountError = null;
      });
      return;
    }
    try {
      final result = await _api.validateDiscount(code);
      if (!mounted) return;
      setState(() {
        _discount = result;
        _discountError = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _discount = null;
        _discountError = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _discount = null;
        _discountError = 'رمز غير صالح';
      });
    }
  }

  Future<void> _confirm() async {
    if (_selectedDate == null || _selectedTime == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('اختر التاريخ والوقت')));
      return;
    }

    final scheduledAt = DateTime(
      _selectedDate!.year,
      _selectedDate!.month,
      _selectedDate!.day,
      _selectedTime!.hour,
      _selectedTime!.minute,
    );

    setState(() => _submitting = true);
    try {
      final appointment = await _api.createAppointment(
        doctorId: widget.doctor.id,
        scheduledAt: scheduledAt,
        discountCode: _discount?.code,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        paymentMethod: _paymentMethod,
      );

      if (_paymentMethod == 'ELECTRONIC') {
        await _api.payConsultation(appointment.id);
      }

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            _paymentMethod == 'ELECTRONIC'
                ? 'تم الحجز والدفع الإلكتروني بنجاح'
                : 'تم إرسال طلب الحجز بنجاح',
          ),
        ),
      );
      Navigator.of(context).popUntil((route) => route.isFirst);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('تعذر حجز الموعد')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('حجز موعد')),
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
                    onPressed: _loadSlots,
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            )
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(
                  widget.doctor.fullName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                  ),
                ),
                Text(
                  widget.doctor.specialty,
                  style: const TextStyle(color: AppColors.primary),
                ),
                const SizedBox(height: 16),
                const Text(
                  'أيام التوفر',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _slots
                      .map(
                        (s) => Chip(
                          label: Text(
                            '${_dayNames[s.dayOfWeek]} ${s.startTime}–${s.endTime}',
                          ),
                        ),
                      )
                      .toList(),
                ),
                const SizedBox(height: 16),
                const Text(
                  'اختر التاريخ',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                if (_availableDates.isEmpty)
                  const Text('لا توجد أيام متاحة خلال الأسبوعين القادمين')
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: _availableDates.map((d) {
                      final selected =
                          _selectedDate != null &&
                          _selectedDate!.year == d.year &&
                          _selectedDate!.month == d.month &&
                          _selectedDate!.day == d.day;
                      return ChoiceChip(
                        label: Text(
                          '${_dayNames[_apiDayOfWeek(d)]}\n${DateFormat('MM/dd').format(d)}',
                          textAlign: TextAlign.center,
                        ),
                        selected: selected,
                        onSelected: (_) {
                          setState(() {
                            _selectedDate = d;
                            _selectedTime = null;
                          });
                        },
                      );
                    }).toList(),
                  ),
                if (_selectedDate != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    'اختر الوقت',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  if (_timeOptions.isEmpty)
                    const Text('لا توجد أوقات متاحة لهذا اليوم')
                  else
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _timeOptions.map((t) {
                        final selected = _selectedTime == t;
                        final label =
                            '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
                        return ChoiceChip(
                          label: Text(label),
                          selected: selected,
                          onSelected: (_) => setState(() => _selectedTime = t),
                        );
                      }).toList(),
                    ),
                ],
                const SizedBox(height: 16),
                TextField(
                  controller: _discountController,
                  decoration: InputDecoration(
                    labelText: 'رمز الخصم (اختياري)',
                    suffixIcon: TextButton(
                      onPressed: _validateDiscount,
                      child: const Text('تحقق'),
                    ),
                  ),
                  textCapitalization: TextCapitalization.characters,
                ),
                if (_discount != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'خصم ${_discount!.percentage}%',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                if (_discountError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _discountError!,
                      style: const TextStyle(color: AppColors.danger),
                    ),
                  ),
                const SizedBox(height: 12),
                TextField(
                  controller: _notesController,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'ملاحظات (اختياري)',
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'طريقة الدفع',
                  style: TextStyle(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('نقدي في العيادة'),
                        selected: _paymentMethod == 'CASH',
                        onSelected: (_) =>
                            setState(() => _paymentMethod = 'CASH'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Text('دفع إلكتروني'),
                        selected: _paymentMethod == 'ELECTRONIC',
                        onSelected: (_) =>
                            setState(() => _paymentMethod = 'ELECTRONIC'),
                      ),
                    ),
                  ],
                ),
                if (_paymentMethod == 'ELECTRONIC') ...[
                  const SizedBox(height: 10),
                  AppCard(
                    margin: EdgeInsets.zero,
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.credit_card_rounded,
                          color: AppColors.primary,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'سيتم خصم $_feeAfterDiscount د.ع الآن عبر الدفع الإلكتروني (تجريبي)',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.inkSoft,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                AppCard(
                  margin: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _price(
                        'الأجور الأصلية',
                        '${widget.doctor.consultationFee} د.ع',
                      ),
                      const SizedBox(height: 8),
                      _price(
                        _discount == null
                            ? 'المبلغ المستحق'
                            : 'بعد خصم ${_discount!.percentage}%',
                        '${_discount == null ? widget.doctor.consultationFee : _feeAfterDiscount} د.ع',
                        bold: true,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _submitting ? null : _confirm,
                  child: _submitting
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Text(
                          _paymentMethod == 'ELECTRONIC'
                              ? 'ادفع واحجز'
                              : 'تأكيد الحجز',
                        ),
                ),
              ],
            ),
    );
  }

  Widget _price(String label, String value, {bool bold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppColors.inkSoft)),
        Text(
          value,
          style: TextStyle(
            fontWeight: bold ? FontWeight.w800 : FontWeight.w600,
            color: bold ? AppColors.primary : AppColors.ink,
          ),
        ),
      ],
    );
  }
}
