/**
 * Se o Info.plist de um app, como JSON, diz que ele foi construído para um dispositivo,
 * que nenhum simulador roda; um que não diz passa.
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
