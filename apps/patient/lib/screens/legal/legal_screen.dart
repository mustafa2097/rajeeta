import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';

class LegalScreen extends StatefulWidget {
  final String title;
  final String assetPath;

  const LegalScreen({super.key, required this.title, required this.assetPath});

  static Future<void> openTerms(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const LegalScreen(
          title: 'شروط الاستخدام',
          assetPath: 'assets/legal/terms.txt',
        ),
      ),
    );
  }

  static Future<void> openPrivacy(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => const LegalScreen(
          title: 'سياسة الخصوصية',
          assetPath: 'assets/legal/privacy.txt',
        ),
      ),
    );
  }

  @override
  State<LegalScreen> createState() => _LegalScreenState();
}

class _LegalScreenState extends State<LegalScreen> {
  String? _text;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final text = await rootBundle.loadString(widget.assetPath);
      if (!mounted) return;
      setState(() => _text = text);
    } catch (_) {
      if (!mounted) return;
      setState(() => _error = 'تعذر تحميل المستند');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: Text(widget.title)),
      body: _error != null
          ? Center(child: Text(_error!))
          : _text == null
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                LiquidGlass(
                  padding: const EdgeInsets.all(16),
                  borderRadius: BorderRadius.circular(16),
                  child: SelectableText(
                    _text!,
                    style: const TextStyle(
                      height: 1.7,
                      fontSize: 14,
                      color: AppColors.ink,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
    );
  }
}
