# Release Instructions: Building the Next Version

This document contains all the technical details needed to build a signed Android App Bundle (AAB) for the Ram Naam Tracker app.

## 1. System Requirements
- **Java Version**: **Java 17** is mandatory. Newer versions (like Java 25) will cause the build to fail.
- **Environment Variables**:
  On your current machine, you must set these before building:
  ```bash
  export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
  export ANDROID_HOME=$HOME/Library/Android/sdk
  ```

## 2. Keystore Information
Your app is signed with the following credentials (configured in `android/gradle.properties`):

- **Keystore File**: `android/app/my-upload-key.keystore`
- **Key Alias**: `my-key-alias`
- **Passwords**: `ramsiyaramsiyaramsiyaram`
  *(Used for both the Store and the Key)*

> [!CAUTION]
> **NEVER LOSE THE KEYSTORE FILE.** 
> If you lose `my-upload-key.keystore` or forget the password, you will NOT be able to update the app on the Play Store. You would have to publish a completely new app.

## 3. Versioning (Important for Updates)
Before building a new version to upload to the Play Store, you **must** increment the version numbers in `app.json`:

1. Open `app.json`.
2. Increase the `version` (e.g., `"1.0.0"` -> `"1.0.1"`).
3. Increase the `android.versionCode` (e.g., `1` -> `2`). **Google Play will reject the upload if the versionCode is not higher than the previous one.**

## 4. Build Command
Run this command from the project root to generate the signed AAB:

```bash
export JAVA_HOME=/usr/local/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home && \
export ANDROID_HOME=$HOME/Library/Android/sdk && \
cd android && \
./gradlew bundleRelease
```

## 5. Output Location
Once the build is successful, your file will be located at:
`android/app/build/outputs/bundle/release/app-release.aab`

## 6. Pro-Tip: EAS Build
If you find the manual build process too complex, you can use **Expo Application Services (EAS)**:
1. Run `eas build --platform android`.
2. Select "App Bundle (AAB)".
3. Expo will handle the Java versions and signing keys on their servers automatically.
