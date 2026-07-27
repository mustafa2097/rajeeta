import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Rajeeta palette — a single ocean family built around #006994.
class AppColors {
  // Core ocean scale (light -> dark), all derived from #006994.
  static const primarySky = Color(0xFF37B4DC);
  static const primaryLight = Color(0xFF00A0D4);
  static const primaryBright = Color(0xFF0088B8);
  static const primary = Color(0xFF006994); // brand anchor
  static const primaryMid = Color(0xFF006994);
  static const primaryDeep = Color(0xFF00415C);
  static const primaryDark = Color(0xFF0B2A38);

  static const primarySoft = Color(0xFFE6F4F9);
  static const primaryMist = Color(0xFFF3FAFD);

  // Accent stays inside the family (no off-brand hues).
  static const accent = Color(0xFF00A0D4);
  static const accentSoft = Color(0xFFDDF2FA);

  static const ink = Color(0xFF0B2A38);
  static const inkSoft = Color(0xFF5A7A8A);
  static const border = Color(0xFFD3E8F1);
  static const surface = Color(0xFFF3FAFD);
  static const card = Colors.white;

  static const danger = Color(0xFFDC2626);
  static const warning = Color(0xFFD97706);
  static const success = Color(0xFF0E9F6E);

  /// One brand gradient used everywhere (specialties, avatars, AI, hero).
  static const brandGradient = [primaryLight, primary, primaryDeep];
  static const gradientSoft = [primaryMist, primarySoft, Color(0xFFEAF4F9)];
  static const aiSlope = [primaryDark, primaryDeep, primary];

  static String _norm(String specialty) => specialty
      .toLowerCase()
      .replaceAll('أ', 'ا')
      .replaceAll('إ', 'ا')
      .replaceAll('آ', 'ا');

  static IconData specialtyIcon(String specialty) {
    final s = _norm(specialty);
    if (s.contains('اطفال') || s.contains('طفل') || s.contains('pedia')) {
      return Icons.child_care_rounded;
    }
    if (s.contains('قلب') || s.contains('اوعية')) {
      return Icons.favorite_rounded;
    }
    if (s.contains('باطن')) return Icons.monitor_heart_rounded;
    if (s.contains('جلد')) return Icons.spa_rounded;
    if (s.contains('عظم')) return Icons.accessibility_new_rounded;
    if (s.contains('اسنان')) return Icons.mood_rounded;
    if (s.contains('عيون') || s.contains('عين')) {
      return Icons.remove_red_eye_rounded;
    }
    if (s.contains('انف') ||
        s.contains('اذن') ||
        s.contains('حنجره') ||
        s.contains('حنجرة')) {
      return Icons.hearing_rounded;
    }
    if (s.contains('نسا') || s.contains('توليد')) {
      return Icons.pregnant_woman_rounded;
    }
    if (s.contains('غدد') || s.contains('سكري')) {
      return Icons.bloodtype_rounded;
    }
    return Icons.medical_services_rounded;
  }

  /// Unified ocean gradient for every specialty (icon carries the meaning).
  static List<Color> specialtyColors(String specialty) => brandGradient;

  /// Deterministic ocean shade per doctor — variety within one family.
  static List<Color> doctorAvatarColors(String doctorId, String specialty) {
    final hash = doctorId.codeUnits.fold<int>(0, (a, b) => a + b) % 4;
    switch (hash) {
      case 1:
        return const [primarySky, primary];
      case 2:
        return const [primaryLight, primaryDeep];
      case 3:
        return const [primaryBright, primaryDark];
      default:
        return const [primaryLight, primary];
    }
  }

  static String doctorInitials(String fullName) {
    final cleaned = fullName.replaceAll('د.', '').replaceAll('د ', '').trim();
    final list = cleaned
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .toList();
    if (list.isEmpty) return 'ر';
    if (list.length == 1) return list.first.characters.first;
    return '${list.first.characters.first}${list.last.characters.first}';
  }
}

class AppTheme {
  static ThemeData get light {
    final base = ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: ColorScheme.fromSeed(
        seedColor: AppColors.primary,
        brightness: Brightness.light,
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.card,
      ),
      scaffoldBackgroundColor: Colors.transparent,
      canvasColor: Colors.transparent,
      fontFamily: 'Tahoma',
      splashFactory: InkSparkle.splashFactory,
    );

    final textTheme = base.textTheme.apply(
      fontFamily: 'Tahoma',
      bodyColor: AppColors.ink,
      displayColor: AppColors.ink,
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.ink,
        centerTitle: true,
        systemOverlayStyle: SystemUiOverlayStyle.dark,
        titleTextStyle: textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: AppColors.ink,
          fontSize: 18,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.card,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppColors.primary, width: 1.4),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 13),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
