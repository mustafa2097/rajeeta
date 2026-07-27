import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/doctor.dart';
import '../theme/app_theme.dart';
import 'glass.dart';

class DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback? onTap;
  final int index;

  const DoctorCard({
    super.key,
    required this.doctor,
    this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    final fee = NumberFormat('#,###').format(doctor.consultationFee);

    return FadeSlideIn(
      index: index,
      child: LiquidGlass(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(14),
        onTap: onTap,
        child: Row(
          children: [
            SpecialtyAvatar(
              specialty: doctor.specialty,
              name: doctor.fullName,
              doctorId: doctor.id,
              size: 50,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    doctor.fullName,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    doctor.specialty,
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    '★ ${doctor.rating.toStringAsFixed(1)}  ·  $fee د.ع',
                    style: const TextStyle(
                      color: AppColors.inkSoft,
                      fontSize: 12.5,
                    ),
                  ),
                  if (doctor.clinicName != null &&
                      doctor.clinicName!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      doctor.clinicName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.inkSoft,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(
              Icons.chevron_left_rounded,
              color: AppColors.primary,
              size: 22,
            ),
          ],
        ),
      ),
    );
  }
}
