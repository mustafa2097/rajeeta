import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

/// Global switch so weak devices can drop real blur without touching call sites.
class AppGlass {
  static bool blurEnabled = true;
}

/// Static ocean background — painted once, cheap (gradient + two soft orbs).
class MeshBackground extends StatelessWidget {
  final Widget child;
  const MeshBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        const Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: AppColors.gradientSoft,
              ),
            ),
          ),
        ),
        Positioned(
          top: -90,
          right: -50,
          child: _orb(220, AppColors.primaryLight.withValues(alpha: 0.14)),
        ),
        Positioned(
          bottom: 80,
          left: -70,
          child: _orb(200, AppColors.primary.withValues(alpha: 0.10)),
        ),
        child,
      ],
    );
  }

  Widget _orb(double size, Color color) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color),
  );
}

/// Apple-style liquid glass panel.
/// Uses a real backdrop blur when [blur] > 0 and [AppGlass.blurEnabled];
/// always wrapped in a RepaintBoundary so it never repaints on scroll.
class LiquidGlass extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final double blur;
  final double opacity;
  final Color? color;

  static final BorderRadius defaultRadius = BorderRadius.circular(18);

  const LiquidGlass({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius,
    this.onTap,
    this.blur = 16,
    this.opacity = 0.68,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? defaultRadius;
    final useBlur = blur > 0 && AppGlass.blurEnabled;
    // Solid mode compensates with higher opacity so text stays readable.
    final fill = (color ?? Colors.white).withValues(
      alpha: useBlur ? opacity : (opacity + 0.24).clamp(0.0, 1.0),
    );

    Widget surface = DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: radius,
        color: fill,
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.55),
          width: 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x14006994),
            blurRadius: 16,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: padding ?? const EdgeInsets.all(14),
        child: child,
      ),
    );

    Widget panel = ClipRRect(
      borderRadius: radius,
      child: useBlur
          ? BackdropFilter(
              filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
              child: surface,
            )
          : surface,
    );

    panel = RepaintBoundary(child: panel);

    if (onTap != null) {
      panel = _Pressable(onTap: onTap!, borderRadius: radius, child: panel);
    }

    return Padding(padding: margin ?? EdgeInsets.zero, child: panel);
  }
}

typedef AppCard = LiquidGlass;

/// Scale-on-press wrapper — the interactive feel across the app.
class _Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback onTap;
  final BorderRadius borderRadius;

  const _Pressable({
    required this.child,
    required this.onTap,
    required this.borderRadius,
  });

  @override
  State<_Pressable> createState() => _PressableState();
}

class _PressableState extends State<_Pressable> {
  bool _down = false;

  void _set(bool v) {
    if (_down != v) setState(() => _down = v);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => _set(true),
      onTapUp: (_) => _set(false),
      onTapCancel: () => _set(false),
      onTap: widget.onTap,
      child: AnimatedScale(
        scale: _down ? 0.97 : 1,
        duration: const Duration(milliseconds: 120),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

/// Public pressable for non-glass elements.
class Pressable extends StatelessWidget {
  final Widget child;
  final VoidCallback onTap;
  final BorderRadius? borderRadius;

  const Pressable({
    super.key,
    required this.child,
    required this.onTap,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) => _Pressable(
    onTap: onTap,
    borderRadius: borderRadius ?? BorderRadius.circular(16),
    child: child,
  );
}

/// Staggered fade + slide entrance. Runs once when the widget first builds
/// (so list rows reveal as they scroll into view — no rebuild on scroll).
class FadeSlideIn extends StatelessWidget {
  final Widget child;
  final int index;
  final Duration duration;

  const FadeSlideIn({
    super.key,
    required this.child,
    this.index = 0,
    this.duration = const Duration(milliseconds: 420),
  });

  @override
  Widget build(BuildContext context) {
    final delay = (index.clamp(0, 8)) * 55;
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: duration + Duration(milliseconds: delay),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) {
        return Opacity(
          opacity: t,
          child: Transform.translate(
            offset: Offset(0, (1 - t) * 18),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

class SpecialtyAvatar extends StatelessWidget {
  final String specialty;
  final String name;
  final String? doctorId;
  final double size;

  const SpecialtyAvatar({
    super.key,
    required this.specialty,
    required this.name,
    this.doctorId,
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    final colors = doctorId != null
        ? AppColors.doctorAvatarColors(doctorId!, specialty)
        : AppColors.brandGradient;

    return RepaintBoundary(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: colors,
          ),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.28),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Center(
          child: Text(
            AppColors.doctorInitials(name),
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w800,
              fontSize: size * 0.36,
              height: 1,
            ),
          ),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: FadeSlideIn(
          child: LiquidGlass(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, size: 40, color: AppColors.primary),
                const SizedBox(height: 12),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 15,
                  ),
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    subtitle!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: AppColors.inkSoft,
                      fontSize: 13,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 10),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 18,
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: AppColors.brandGradient,
              ),
              borderRadius: BorderRadius.circular(4),
            ),
          ),
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 16.5,
                fontWeight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
          ),
          if (actionLabel != null)
            GestureDetector(
              onTap: onAction,
              child: Text(
                actionLabel!,
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle(this.title, {super.key});

  @override
  Widget build(BuildContext context) => SectionHeader(title: title);
}

/// Frosted bottom nav with an animated selection indicator.
class GlassNotchedNav extends StatelessWidget {
  final int index;
  final ValueChanged<int> onChanged;

  const GlassNotchedNav({
    super.key,
    required this.index,
    required this.onChanged,
  });

  static const _sideItems = [
    (0, Icons.home_outlined, Icons.home_rounded, 'الرئيسية'),
    (1, Icons.event_note_outlined, Icons.event_note_rounded, 'مواعيدي'),
    (3, Icons.medication_outlined, Icons.medication_rounded, 'راجيتاتي'),
    (4, Icons.person_outline_rounded, Icons.person_rounded, 'حسابي'),
  ];

  @override
  Widget build(BuildContext context) {
    final bar = BottomAppBar(
      elevation: 0,
      color: Colors.white.withValues(alpha: AppGlass.blurEnabled ? 0.72 : 0.96),
      surfaceTintColor: Colors.transparent,
      shadowColor: const Color(0x1A006994),
      padding: EdgeInsets.zero,
      height: 66,
      notchMargin: 9,
      shape: const CircularNotchedRectangle(),
      child: Row(
        children: [
          for (var i = 0; i < 2; i++) Expanded(child: _navItem(_sideItems[i])),
          const SizedBox(width: 64),
          for (var i = 2; i < 4; i++) Expanded(child: _navItem(_sideItems[i])),
        ],
      ),
    );

    if (!AppGlass.blurEnabled) return bar;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: bar,
      ),
    );
  }

  Widget _navItem((int, IconData, IconData, String) item) {
    final selected = index == item.$1;
    return Pressable(
      onTap: () => onChanged(item.$1),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
        padding: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: selected
              ? AppColors.primary.withValues(alpha: 0.10)
              : Colors.transparent,
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              selected ? item.$3 : item.$2,
              color: selected ? AppColors.primary : AppColors.inkSoft,
              size: 22,
            ),
            const SizedBox(height: 2),
            Text(
              item.$4,
              style: TextStyle(
                fontSize: 10.5,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? AppColors.primary : AppColors.inkSoft,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Center AI action — gradient orb with press feedback + soft glow.
class CenterAiFab extends StatefulWidget {
  final bool active;
  final VoidCallback onPressed;

  const CenterAiFab({super.key, required this.active, required this.onPressed});

  @override
  State<CenterAiFab> createState() => _CenterAiFabState();
}

class _CenterAiFabState extends State<CenterAiFab> {
  bool _down = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _down = true),
      onTapUp: (_) => setState(() => _down = false),
      onTapCancel: () => setState(() => _down = false),
      onTap: widget.onPressed,
      child: AnimatedScale(
        scale: _down ? 0.9 : 1,
        duration: const Duration(milliseconds: 130),
        curve: Curves.easeOut,
        child: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: AppColors.brandGradient,
            ),
            border: Border.all(color: Colors.white, width: 3),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.42),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Icon(
            widget.active
                ? Icons.auto_awesome_rounded
                : Icons.auto_awesome_outlined,
            color: Colors.white,
            size: 26,
          ),
        ),
      ),
    );
  }
}

class GradientButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;

  const GradientButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final enabled = !loading && onPressed != null;
    return Pressable(
      onTap: enabled ? onPressed! : () {},
      borderRadius: BorderRadius.circular(14),
      child: Opacity(
        opacity: enabled ? 1 : 0.6,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            gradient: const LinearGradient(colors: AppColors.brandGradient),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.3),
                blurRadius: 12,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (loading)
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                )
              else
                Icon(icon ?? Icons.check, size: 18, color: Colors.white),
              const SizedBox(width: 8),
              Text(
                label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class SpecialtyCard extends StatelessWidget {
  final String specialty;
  final bool selected;
  final VoidCallback onTap;
  final int index;

  const SpecialtyCard({
    super.key,
    required this.specialty,
    required this.selected,
    required this.onTap,
    this.index = 0,
  });

  @override
  Widget build(BuildContext context) {
    return FadeSlideIn(
      index: index,
      child: Pressable(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: 116,
          height: 108,
          margin: const EdgeInsets.only(left: 10),
          padding: const EdgeInsets.all(13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: AppColors.brandGradient,
            ),
            border: Border.all(
              color: selected
                  ? Colors.white
                  : Colors.white.withValues(alpha: 0.35),
              width: selected ? 2 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.28),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  AppColors.specialtyIcon(specialty),
                  color: Colors.white,
                  size: 22,
                ),
              ),
              const Spacer(),
              Text(
                specialty,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 12.5,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class AiSlopeCard extends StatelessWidget {
  final VoidCallback? onTap;

  const AiSlopeCard({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap ?? () {},
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: AppColors.aiSlope,
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: const Icon(
                Icons.auto_awesome_rounded,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'المساعد الذكي',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.3,
                    ),
                  ),
                  SizedBox(height: 3),
                  Text(
                    'صف أعراضك واحصل على اقتراح أطباء',
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      fontSize: 14.5,
                      height: 1.3,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(
              Icons.chevron_left_rounded,
              color: Colors.white,
              size: 24,
            ),
          ],
        ),
      ),
    );
  }
}
