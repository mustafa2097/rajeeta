import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass.dart';
import '../legal/legal_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _ageController = TextEditingController();
  final _bloodTypeController = TextEditingController();
  final _chronicController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscure = true;
  bool _acceptedTerms = false;
  bool _acceptedPrivacy = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _ageController.dispose();
    _bloodTypeController.dispose();
    _chronicController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_acceptedTerms || !_acceptedPrivacy) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يجب الموافقة على شروط الاستخدام وسياسة الخصوصية'),
        ),
      );
      return;
    }

    final age = int.tryParse(_ageController.text.trim());
    if (age == null || age < 1) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('أدخل عمراً صحيحاً')));
      return;
    }

    final chronic = _chronicController.text
        .split(',')
        .map((e) => e.trim())
        .where((e) => e.isNotEmpty)
        .toList();

    final auth = context.read<AuthProvider>();
    final ok = await auth.register(
      email: _emailController.text,
      phone: _phoneController.text,
      password: _passwordController.text,
      fullName: _fullNameController.text,
      age: age,
      bloodType: _bloodTypeController.text.trim().isEmpty
          ? null
          : _bloodTypeController.text.trim(),
      chronicDiseases: chronic,
    );

    if (!mounted) return;
    if (ok) {
      // Auth flips home to MainShell via KeyedSubtree — clear register route.
      Navigator.of(context).popUntil((route) => route.isFirst);
    } else {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(auth.error ?? 'فشل إنشاء الحساب')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(title: const Text('تسجيل مريض جديد')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: FadeSlideIn(
              child: LiquidGlass(
                padding: const EdgeInsets.all(18),
                borderRadius: BorderRadius.circular(16),
                child: Column(
                  children: [
                    Image.asset(
                      'assets/images/logo_icon.png',
                      width: 88,
                      height: 88,
                      fit: BoxFit.contain,
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'إنشاء حساب مريض',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _fullNameController,
                      decoration: const InputDecoration(
                        labelText: 'الاسم الكامل',
                      ),
                      validator: (v) =>
                          (v == null || v.trim().length < 2) ? 'مطلوب' : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'العمر'),
                      validator: (v) =>
                          (v == null || int.tryParse(v.trim()) == null)
                          ? 'أدخل رقماً'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _bloodTypeController,
                      decoration: const InputDecoration(
                        labelText: 'فصيلة الدم (اختياري)',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _chronicController,
                      decoration: const InputDecoration(
                        labelText: 'الأمراض المزمنة (مفصولة بفاصلة)',
                        helperText: 'مثال: سكري، ضغط',
                      ),
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(
                        labelText: 'البريد الإلكتروني',
                      ),
                      validator: (v) => (v == null || !v.contains('@'))
                          ? 'بريد غير صالح'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'رقم الهاتف',
                      ),
                      validator: (v) => (v == null || v.trim().length < 8)
                          ? 'رقم غير صالح'
                          : null,
                    ),
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _passwordController,
                      obscureText: _obscure,
                      decoration: InputDecoration(
                        labelText: 'كلمة المرور',
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscure ? Icons.visibility : Icons.visibility_off,
                          ),
                          onPressed: () => setState(() => _obscure = !_obscure),
                        ),
                      ),
                      validator: (v) => (v == null || v.length < 8)
                          ? '٨ أحرف على الأقل'
                          : null,
                    ),
                    const SizedBox(height: 16),
                    _legalCheck(
                      value: _acceptedTerms,
                      onChanged: (v) =>
                          setState(() => _acceptedTerms = v ?? false),
                      label: 'أوافق على ',
                      linkLabel: 'شروط الاستخدام',
                      onLink: () => LegalScreen.openTerms(context),
                    ),
                    const SizedBox(height: 8),
                    _legalCheck(
                      value: _acceptedPrivacy,
                      onChanged: (v) =>
                          setState(() => _acceptedPrivacy = v ?? false),
                      label: 'أوافق على ',
                      linkLabel: 'سياسة الخصوصية',
                      onLink: () => LegalScreen.openPrivacy(context),
                    ),
                    const SizedBox(height: 22),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: auth.busy ? null : _submit,
                        child: auth.busy
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('إنشاء الحساب'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _legalCheck({
    required bool value,
    required ValueChanged<bool?> onChanged,
    required String label,
    required String linkLabel,
    required VoidCallback onLink,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 24,
          height: 24,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: AppColors.primary,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text.rich(
            TextSpan(
              style: const TextStyle(fontSize: 13.5, color: AppColors.ink),
              children: [
                TextSpan(text: label),
                TextSpan(
                  text: linkLabel,
                  style: const TextStyle(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                    decoration: TextDecoration.underline,
                  ),
                  recognizer: TapGestureRecognizer()..onTap = onLink,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
