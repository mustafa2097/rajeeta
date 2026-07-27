import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../navigation/app_routes.dart';
import '../../models/doctor.dart';
import '../../providers/doctors_provider.dart';
import '../../widgets/doctor_card.dart';
import '../../widgets/glass.dart';
import 'doctor_detail_screen.dart';

/// Page listing doctors for a single specialty only.
class SpecialtyDoctorsScreen extends StatefulWidget {
  final String specialty;

  const SpecialtyDoctorsScreen({super.key, required this.specialty});

  @override
  State<SpecialtyDoctorsScreen> createState() => _SpecialtyDoctorsScreenState();
}

class _SpecialtyDoctorsScreenState extends State<SpecialtyDoctorsScreen> {
  final _searchController = TextEditingController();
  String _search = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<Doctor> _doctors(DoctorsProvider provider) {
    return provider.doctors.where((d) {
      if (d.specialty != widget.specialty) return false;
      if (_search.isEmpty) return true;
      return d.fullName.contains(_search) ||
          (d.clinicName?.contains(_search) ?? false);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DoctorsProvider>();
    final doctors = _doctors(provider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: Text(widget.specialty),
        leading: IconButton(
          icon: const Icon(Icons.arrow_forward_rounded),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: LiquidGlass(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              blur: 6,
              opacity: 0.82,
              child: TextField(
                controller: _searchController,
                onChanged: (v) => setState(() => _search = v.trim()),
                decoration: const InputDecoration(
                  hintText: 'ابحث داخل هذا التخصص',
                  prefixIcon: Icon(Icons.search_rounded),
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  filled: false,
                ),
              ),
            ),
          ),
          Expanded(
            child: provider.loading && provider.doctors.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : doctors.isEmpty
                ? const EmptyState(
                    icon: Icons.person_search_rounded,
                    title: 'لا يوجد أطباء في هذا التخصص',
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: doctors.length,
                    itemBuilder: (context, index) {
                      final doctor = doctors[index];
                      return DoctorCard(
                        doctor: doctor,
                        index: index,
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
    );
  }
}
