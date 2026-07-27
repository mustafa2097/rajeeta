import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/doctors_provider.dart';
import 'screens/ai/ai_assistant_screen.dart';
import 'screens/appointments/appointments_screen.dart';
import 'screens/auth/welcome_screen.dart';
import 'screens/home/home_screen.dart';
import 'screens/prescriptions/prescriptions_screen.dart';
import 'screens/profile/profile_screen.dart';
import 'theme/app_theme.dart';
import 'widgets/glass.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  final auth = AuthProvider();
  await auth.init();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: auth),
        ChangeNotifierProvider(create: (_) => DoctorsProvider()),
      ],
      child: const RajeetaPatientApp(),
    ),
  );
}

class RajeetaPatientApp extends StatelessWidget {
  const RajeetaPatientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'راجيتة',
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      theme: AppTheme.light,
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: MeshBackground(child: child ?? const SizedBox.shrink()),
        );
      },
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          if (auth.loading) {
            return const Scaffold(
              backgroundColor: Colors.transparent,
              body: Center(child: CircularProgressIndicator()),
            );
          }
          // Key forces full tree reset so login/register routes vanish after auth.
          return KeyedSubtree(
            key: ValueKey(auth.isAuthenticated ? 'app-authed' : 'app-guest'),
            child: auth.isAuthenticated
                ? const MainShell()
                : const WelcomeScreen(),
          );
        },
      ),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  List<Widget> get _screens => [
    HomeScreen(onNavigate: (i) => setState(() => _index = i)),
    const AppointmentsScreen(),
    const AiAssistantScreen(),
    const PrescriptionsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      extendBody: true,
      body: IndexedStack(index: _index, children: _screens),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: CenterAiFab(
        active: _index == 2,
        onPressed: () => setState(() => _index = 2),
      ),
      bottomNavigationBar: GlassNotchedNav(
        index: _index,
        onChanged: (i) => setState(() => _index = i),
      ),
    );
  }
}
