const {
  withAndroidManifest,
  withDangerousMod,
  AndroidConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

// The Zoom Android SDK (us.zoom.meetingsdk:zoomsdk) ships its own
// AndroidManifest.xml declaring, on its <application> tag:
//   android:allowBackup="false"
//   android:networkSecurityConfig="@xml/msdk_network_security_config"
//   android:usesCleartextTraffic="false"
// `allowBackup` conflicts with our manifest's own value and fails the
// merger outright, so it needs tools:replace. `networkSecurityConfig` isn't
// declared by our manifest at all, so the merger adopts Zoom's silently (no
// error) — and since an explicit networkSecurityConfig takes precedence over
// the simpler usesCleartextTraffic flag, Zoom's cleartext-blocking policy
// wins even though Expo's debug manifest correctly sets
// usesCleartextTraffic="true" for the local Metro connection. Overriding
// networkSecurityConfig to point at our own resource (permissive in debug,
// stricter in release, via normal Android sourceSet resource resolution)
// fixes the Metro "CLEARTEXT communication ... not permitted" error.
// Since android/ is regenerated on every `expo prebuild`, both the manifest
// attribute and the resource files must be injected via a plugin.
const withZoomAndroidManifest = (config) => {
  config = withAndroidManifest(config, (config) => {
    config.modResults = AndroidConfig.Manifest.ensureToolsAvailable(
      config.modResults
    );
    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults
    );

    const existing = mainApplication.$['tools:replace']
      ? mainApplication.$['tools:replace'].split(',')
      : [];
    const replaced = new Set([
      ...existing,
      'android:allowBackup',
      'android:networkSecurityConfig',
    ]);
    mainApplication.$['tools:replace'] = Array.from(replaced).join(',');
    mainApplication.$['android:networkSecurityConfig'] =
      '@xml/network_security_config';

    return config;
  });

  return withDangerousMod(config, [
    'android',
    (config) => {
      writeNetworkSecurityConfig(
        path.join(
          config.modRequest.platformProjectRoot,
          'app/src/main/res/xml/network_security_config.xml'
        ),
        false
      );
      writeNetworkSecurityConfig(
        path.join(
          config.modRequest.platformProjectRoot,
          'app/src/debug/res/xml/network_security_config.xml'
        ),
        true
      );
      return config;
    },
  ]);
};

function writeNetworkSecurityConfig(filePath, cleartextPermitted) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    `<?xml version="1.0" encoding="utf-8"?>\n<network-security-config>\n    <base-config cleartextTrafficPermitted="${cleartextPermitted}" />\n</network-security-config>\n`
  );
}

module.exports = withZoomAndroidManifest;
