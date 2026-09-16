import type { IDeviceTools } from '@/types';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findExistingPath, findOnPath } from '@/main/library';
import { TOOL_PATHS } from './constants';

/** Looks for what a device target needs. It downloads none of it: it reports what is here. */
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

    // idb is the only way to tap an iOS simulator: simctl boots and installs, but never touches.
    const idb =
      process.platform === 'darwin'
        ? findOnPath({ command: 'idb', directories: [...TOOL_PATHS.idb] })
        : null;

    this.detected = {
      androidSdk: { isFound: androidSdk !== null, path: androidSdk },
      xcode: { isFound: xcode !== null, path: xcode },
      idb: { isFound: idb !== null, path: idb },
    };

    return this.detected;
  }
}
