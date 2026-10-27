/**
 * Whether an app's Info.plist, as JSON, says it was built for a device, which no
 * simulator runs; one that does not say passes.
 */
export function isDevicePlist(json: string): boolean {
  try {
    const plist = JSON.parse(json) as {
      DTPlatformName?: unknown;
      CFBundleSupportedPlatforms?: unknown;
    };
    const platforms = Array.isArray(plist.CFBundleSupportedPlatforms)
      ? plist.CFBundleSupportedPlatforms
      : [];

    return (
      plist.DTPlatformName === 'iphoneos' ||
      (platforms.length > 0 && !platforms.includes('iPhoneSimulator'))
    );
  } catch {
    return false;
  }
}
