import 'package:flutter/material.dart';

import '../widgets/glass.dart';

/// Opaque routes that paint their own mesh background.
/// Opaque => the pushed page fully covers the screen below (no overlap),
/// and the built-in [MeshBackground] means no white flash on entry.
class AppRoutes {
  static Route<T> mesh<T>(Widget page) {
    return PageRouteBuilder<T>(
      maintainState: true,
      transitionDuration: const Duration(milliseconds: 320),
      reverseTransitionDuration: const Duration(milliseconds: 240),
      pageBuilder: (context, animation, secondaryAnimation) =>
          MeshBackground(child: page),
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        final curved = CurvedAnimation(
          parent: animation,
          curve: Curves.easeOutCubic,
          reverseCurve: Curves.easeInCubic,
        );
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.035),
              end: Offset.zero,
            ).animate(curved),
            child: child,
          ),
        );
      },
    );
  }
}
