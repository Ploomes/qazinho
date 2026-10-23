import { describe, expect, it } from 'vitest';
import { pickArtifact } from '@/main/classes/builds/AppBuilder/library';

describe('pickArtifact', () => {
  it('takes the release output first, then the newest of the rest', () => {
    expect(
      pickArtifact({
        platform: 'android',
        found: [
          {
            path: '/b/src/android/app/build/outputs/apk/debug/app-debug.apk',
            modifiedMs: 9,
          },
          {
            path: '/b/src/android/app/build/outputs/apk/release/app-release.apk',
            modifiedMs: 5,
          },
          { path: '/b/src/vendor/sample.apk', modifiedMs: 10 },
        ],
      }),
    ).toBe('/b/src/android/app/build/outputs/apk/release/app-release.apk');
  });

  it("takes a simulator .app, never a device one nor the other platform's file", () => {
    expect(
      pickArtifact({
        platform: 'ios',
        found: [
          { path: '/b/src/build/Build/Products/Debug-iphoneos/Loja.app', modifiedMs: 9 },
          {
            path: '/b/src/build/Build/Products/Debug-iphonesimulator/Loja.app',
            modifiedMs: 5,
          },
          { path: '/b/src/android/app-debug.apk', modifiedMs: 10 },
        ],
      }),
    ).toBe('/b/src/build/Build/Products/Debug-iphonesimulator/Loja.app');
  });

  it('takes no unsigned or test build, and says so when nothing is left', () => {
    expect(
      pickArtifact({
        platform: 'android',
        found: [
          {
            path: '/b/src/app/build/outputs/apk/release/app-release-unsigned.apk',
            modifiedMs: 1,
          },
          {
            path: '/b/src/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
            modifiedMs: 2,
          },
        ],
      }),
    ).toBeNull();
  });

  it('takes the release output first on Windows, its folders written with backslashes', () => {
    expect(
      pickArtifact({
        platform: 'android',
        found: [
          {
            path: 'C:\\b\\android\\app\\build\\outputs\\apk\\debug\\app-debug.apk',
            modifiedMs: 9,
          },
          {
            path: 'C:\\b\\android\\app\\build\\outputs\\apk\\release\\app-release.apk',
            modifiedMs: 5,
          },
        ],
      }),
    ).toBe('C:\\b\\android\\app\\build\\outputs\\apk\\release\\app-release.apk');
  });
});
