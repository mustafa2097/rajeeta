# Rajeeta iOS release

The iOS project is configured with:

- App name: `راجيتة`
- Bundle identifier: `iq.rajeeta.patient`
- Version source: `pubspec.yaml` (`3.1.0+4`)
- Minimum iOS version: 13.0
- Portrait orientation
- App icon set
- Privacy manifest
- Non-exempt encryption declaration

## Required before building

1. Deploy the API behind a public HTTPS URL. A local IP or plain HTTP URL is
   not suitable for an App Store build.
2. Create the App ID `iq.rajeeta.patient` in the Apple Developer portal.
3. Create the app record in App Store Connect.
4. Confirm that the privacy policy accurately covers account, contact, and
   health data.

## Validate on any development machine

```bash
flutter pub get
dart format --set-exit-if-changed lib test
flutter analyze
flutter test
dart run flutter_launcher_icons
```

## Build on macOS

Install the current stable Flutter SDK and Xcode, then:

```bash
cd apps/patient
flutter clean
flutter pub get
open ios/Runner.xcworkspace
```

In Xcode:

1. Select the **Runner** target.
2. Open **Signing & Capabilities**.
3. Select the correct Apple Developer team.
4. Keep **Automatically manage signing** enabled.
5. Verify the bundle identifier is `iq.rajeeta.patient`.

Build the archive using the production API:

```bash
flutter build ipa --release \
  --dart-define=API_BASE_URL=https://api.your-domain.com/api
```

The archive and IPA are generated under `build/ios/`. Validate and upload with
Xcode Organizer or Transporter.

## App Store Connect checklist

- App name, subtitle, category, and age rating
- Arabic and English descriptions
- iPhone screenshots for all required display sizes
- Support URL and public privacy-policy URL
- App Privacy answers matching `Runner/PrivacyInfo.xcprivacy`
- Review notes and a working patient demo account
- Production API availability during App Review
- Increment the build number in `pubspec.yaml` for every upload

