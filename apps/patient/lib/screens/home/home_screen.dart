import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/doctor.dart';
import '../../navigation/app_routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/doctors_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/doctor_card.dart';
import '../../widgets/glass.dart';
import '../doctors/doctor_detail_screen.dart';
import '../doctors/specialty_doctors_screen.dart';
import '../notifications/notifications_screen.dart';

class HomeScreen extends StatefulWidget {
  final ValueChanged<int>? onNavigate;

  const HomeScreen({super.key, this.onNavigate});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DoctorsProvider>().load();
    });
  }

  void _openNotifications() {
    Navigator.of(context).push(AppRoutes.mesh(const NotificationsScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final top = MediaQuery.paddingOf(context).top;
    final name = auth.user?.displayName ?? 'بك';

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () => context.read<DoctorsProvider>().load(),
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(
            parent: AlwaysScrollableScrollPhysics(),
          ),
          slivers: [
            SliverToBoxAdapter(child: SizedBox(height: top + 8)),
            SliverToBoxAdapter(
              child: FadeSlideIn(
                child: _HomeHeader(
                  name: name,
                  onAppointments: () => widget.onNavigate?.call(1),
                  onNotifications: _openNotifications,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: FadeSlideIn(
                index: 1,
                child: _HomeSearch(
                  onSearch: context.read<DoctorsProvider>().setSearch,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: FadeSlideIn(
                index: 2,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
                  child: AiSlopeCard(onTap: () => widget.onNavigate?.call(2)),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: _HomeSpecialties(
                onSpecialtyTap: (s) {
                  Navigator.of(
                    context,
                  ).push(AppRoutes.mesh(SpecialtyDoctorsScreen(specialty: s)));
                },
              ),
            ),
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'أقسام سريعة'),
            ),
            SliverToBoxAdapter(
              child: _HomeQuickActions(
                onAppointments: () => widget.onNavigate?.call(1),
                onNotifications: _openNotifications,
              ),
            ),
            const SliverToBoxAdapter(child: SectionHeader(title: 'الأطباء')),
            _HomeDoctorsList(
              onDoctorTap: (id) {
                Navigator.of(
                  context,
                ).push(AppRoutes.mesh(DoctorDetailScreen(doctorId: id)));
              },
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 110)),
          ],
        ),
      ),
    );
  }
}

class _HomeHeader extends StatelessWidget {
  final String name;
  final VoidCallback onAppointments;
  final VoidCallback onNotifications;

  const _HomeHeader({
    required this.name,
    required this.onAppointments,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: LiquidGlass(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        child: Row(
          children: [
            Image.asset('assets/images/logo_icon.png', width: 40, height: 40),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'راجيتة',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primary,
                    ),
                  ),
                  Text(
                    'مرحباً، $name',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: AppColors.inkSoft,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            _iconBtn(Icons.event_note_rounded, onAppointments),
            const SizedBox(width: 6),
            _iconBtn(Icons.notifications_none_rounded, onNotifications),
          ],
        ),
      ),
    );
  }

  Widget _iconBtn(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          color: AppColors.primarySoft,
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 18, color: AppColors.primary),
      ),
    );
  }
}

class _HomeSearch extends StatefulWidget {
  final ValueChanged<String> onSearch;
  const _HomeSearch({required this.onSearch});

  @override
  State<_HomeSearch> createState() => _HomeSearchState();
}

class _HomeSearchState extends State<_HomeSearch> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: const LinearGradient(colors: AppColors.brandGradient),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33006994),
              blurRadius: 12,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'ابحث عن طبيبك',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: _controller,
              onChanged: widget.onSearch,
              decoration: InputDecoration(
                hintText: 'اسم الطبيب أو العيادة',
                filled: true,
                fillColor: AppColors.card,
                prefixIcon: const Icon(
                  Icons.search_rounded,
                  color: AppColors.primary,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HomeSpecialties extends StatelessWidget {
  final ValueChanged<String> onSpecialtyTap;
  const _HomeSpecialties({required this.onSpecialtyTap});

  @override
  Widget build(BuildContext context) {
    final specialties = context.select<DoctorsProvider, List<String>>(
      (p) => p.specialties,
    );
    if (specialties.isEmpty) return const SizedBox.shrink();

    return Column(
      children: [
        const SectionHeader(title: 'التخصصات'),
        SizedBox(
          height: 108,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 12),
            itemCount: specialties.length,
            itemBuilder: (context, index) {
              final s = specialties[index];
              return SpecialtyCard(
                specialty: s,
                selected: false,
                index: index,
                onTap: () => onSpecialtyTap(s),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _HomeQuickActions extends StatelessWidget {
  final VoidCallback onAppointments;
  final VoidCallback onNotifications;
  const _HomeQuickActions({
    required this.onAppointments,
    required this.onNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _tile(
                  Icons.event_note_rounded,
                  'مواعيدي',
                  onAppointments,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _tile(
                  Icons.notifications_none_rounded,
                  'الإشعارات',
                  onNotifications,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _tile(IconData icon, String title, VoidCallback onTap) {
    return LiquidGlass(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.primary, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 13.5,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _HomeDoctorsList extends StatelessWidget {
  final ValueChanged<String> onDoctorTap;
  const _HomeDoctorsList({required this.onDoctorTap});

  @override
  Widget build(BuildContext context) {
    final loading = context.select<DoctorsProvider, bool>((p) => p.loading);
    final error = context.select<DoctorsProvider, String?>((p) => p.error);
    final doctors = context.select<DoctorsProvider, List<Doctor>>(
      (p) => p.filteredDoctors,
    );

    if (loading && doctors.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (error != null && doctors.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: EmptyState(icon: Icons.wifi_off_outlined, title: error),
      );
    }
    if (doctors.isEmpty) {
      return const SliverFillRemaining(
        hasScrollBody: false,
        child: EmptyState(
          icon: Icons.search_off_rounded,
          title: 'لا يوجد أطباء',
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate((context, index) {
        final doctor = doctors[index];
        return DoctorCard(
          doctor: doctor,
          index: index,
          onTap: () => onDoctorTap(doctor.id),
        );
      }, childCount: doctors.length),
    );
  }
}
