class ApiConfig {
  // Production builds should pass the complete HTTPS endpoint:
  //   --dart-define=API_BASE_URL=https://api.example.com/api
  //
  // API_HOST remains available for local Android/hotspot development:
  //   --dart-define=API_HOST=192.168.x.x
  static const String _configuredBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
  );
  static const String host = String.fromEnvironment(
    'API_HOST',
    defaultValue: '10.0.2.2',
  );
  static const int port = 3001;

  static String get baseUrl => _configuredBaseUrl.isNotEmpty
      ? _withoutTrailingSlash(_configuredBaseUrl)
      : 'http://$host:$port/api';

  static String get uploadsBase {
    final uri = Uri.parse(baseUrl);
    return uri
        .replace(path: '', query: null, fragment: null)
        .toString()
        .replaceAll(RegExp(r'/$'), '');
  }

  static String _withoutTrailingSlash(String value) =>
      value.replaceAll(RegExp(r'/+$'), '');
}
