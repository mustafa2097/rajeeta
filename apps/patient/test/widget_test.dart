import 'package:flutter_test/flutter_test.dart';
import 'package:patient/config/api_config.dart';

void main() {
  test('API configuration exposes valid base URLs', () {
    final apiUri = Uri.parse(ApiConfig.baseUrl);
    final uploadsUri = Uri.parse(ApiConfig.uploadsBase);

    expect(apiUri.hasScheme, isTrue);
    expect(apiUri.host, isNotEmpty);
    expect(apiUri.path, endsWith('/api'));
    expect(uploadsUri.origin, apiUri.origin);
  });
}
