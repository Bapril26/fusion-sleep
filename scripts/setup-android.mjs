// Adds Fusion Sleep's native pieces to the Capacitor Android project.
// Run once after `npx cap add android` (npm run android:add does both).
// Safe to run again: every step checks whether it has already been applied.
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const android = path.join(root, 'android');
const main = path.join(android, 'app/src/main');
const pkgDir = path.join(main, 'java/za/co/fusionlabs/sleep');

if (!existsSync(main)) {
  console.error('✗ No android/ project found. Run "npx cap add android" first.');
  process.exit(1);
}

const step = (msg) => console.log('✓ ' + msg);

// 1. Native playback plugin + service
mkdirSync(pkgDir, { recursive: true });
for (const f of ['FusionPlaybackPlugin.java', 'PlaybackService.java']) {
  copyFileSync(path.join(root, 'android-src/java', f), path.join(pkgDir, f));
}
step('Copied background playback service and plugin');

// 2. Register the plugin in MainActivity
const activity = path.join(pkgDir, 'MainActivity.java');
writeFileSync(activity, `package za.co.fusionlabs.sleep;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FusionPlaybackPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);
step('Registered FusionPlayback plugin in MainActivity');

// 3. Manifest: permissions + service
const manifestPath = path.join(main, 'AndroidManifest.xml');
let manifest = readFileSync(manifestPath, 'utf8');
const perms = [
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.WAKE_LOCK',
  'android.permission.POST_NOTIFICATIONS',
];
for (const p of perms) {
  if (!manifest.includes(`"${p}"`)) manifest = manifest.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
}
if (!manifest.includes('.PlaybackService')) {
  manifest = manifest.replace('</application>', `        <service
            android:name=".PlaybackService"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />
    </application>`);
}
writeFileSync(manifestPath, manifest);
step('Updated AndroidManifest.xml (permissions + playback service)');

// 4. Icons, notification icon, splash
const res = path.join(main, 'res');
const copyTree = (from, to) => {
  for (const name of readdirSync(from)) {
    const src = path.join(from, name), dst = path.join(to, name);
    if (statSync(src).isDirectory()) { mkdirSync(dst, { recursive: true }); copyTree(src, dst); }
    else copyFileSync(src, dst);
  }
};
for (const dir of readdirSync(res)) {
  const splash = path.join(res, dir, 'splash.png');
  if (dir.startsWith('drawable') && existsSync(splash)) rmSync(splash);
}
copyTree(path.join(root, 'android-src/res'), res);
step('Installed app icon, notification icon and launch screen');

// 5. Black system bars
const stylesPath = path.join(res, 'values/styles.xml');
if (existsSync(stylesPath)) {
  let styles = readFileSync(stylesPath, 'utf8');
  if (!styles.includes('android:statusBarColor')) {
    styles = styles.replace(/(<style name="AppTheme.NoActionBar"[^>]*>)/, `$1
        <item name="android:statusBarColor">@android:color/black</item>
        <item name="android:navigationBarColor">@android:color/black</item>`);
    writeFileSync(stylesPath, styles);
  }
  step('Set black status and navigation bars');
}

// 6. Version name
const gradlePath = path.join(android, 'app/build.gradle');
if (existsSync(gradlePath)) {
  const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
  writeFileSync(gradlePath, readFileSync(gradlePath, 'utf8').replace(/versionName "[^"]*"/, `versionName "${pkg.version}"`));
  step(`Set versionName ${pkg.version}`);
}

console.log('\nAndroid project ready. Next: npm run android:sync, then npm run android:open (or npm run android:apk).');
