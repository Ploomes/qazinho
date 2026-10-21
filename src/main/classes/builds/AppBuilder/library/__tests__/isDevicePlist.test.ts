import { describe, expect, it } from 'vitest';
import { isDevicePlist } from '@/main/classes/builds/AppBuilder/library';

describe('isDevicePlist', () => {
  it('turns down an app built for a device', () => {
    expect(isDevicePlist('{"DTPlatformName":"iphoneos"}')).toBe(true);
    expect(isDevicePlist('{"CFBundleSupportedPlatforms":["iPhoneOS"]}')).toBe(true);
  });

  it('lets a simulator app through, and one that does not say', () => {
    expect(
      isDevicePlist(
        '{"DTPlatformName":"iphonesimulator","CFBundleSupportedPlatforms":["iPhoneSimulator"]}',
      ),
    ).toBe(false);
    expect(isDevicePlist('{"CFBundleExecutable":"Fixture"}')).toBe(false);
    expect(isDevicePlist('not json')).toBe(false);
  });
});
