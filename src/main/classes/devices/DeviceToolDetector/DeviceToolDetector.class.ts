import type { IDeviceTools } from '@/types';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findExistingPath } from '@/main/library';
import { TOOL_PATHS } from './constants';

/** Looks for the Android SDK and Xcode. It never downloads either: it reports what is here. */
export class DeviceToolDetector {
  private detected: IDeviceTools | null = null;

  public detect(): IDeviceTools {
    if (this.detected) return this.detected;

    const home = homedir();

    const androidSdk = findExistingPath([
      process.env.ANDROID_HOME,
      process.env.ANDROID_SDK_ROOT,
      ...TOOL_PATHS.androidSdk.map((directory) => join(home, directory)),
    ]);

    // Xcode only exists on macOS, so anywhere else the iOS target stays off.
    const xcode =
      process.platform === 'darwin' ? findExistingPath([...TOOL_PATHS.xcode]) : null;

    this.detected = {
      androidSdk: { isFound: androidSdk !== null, path: androidSdk },
      xcode: { isFound: xcode !== null, path: xcode },
    };

    return this.detected;
  }
}
