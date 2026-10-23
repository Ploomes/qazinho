import type { IDeviceTools } from '@/shared/types';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findExistingPath, findOnPath } from '@/main/library';
import { TOOL_PATHS } from './constants';

/** Looks for what a device target needs, and reports what is here. */
export class DeviceToolDetector {
  private detected: IDeviceTools | null = null;

  public detect(): IDeviceTools {
    if (this.detected) return this.detected;

    const home = homedir();

    const androidSdk = findExistingPath([
      process.env.ANDROID_HOME,
      process.env.ANDROID_SDK_ROOT,
      process.env.LOCALAPPDATA === undefined
        ? undefined
        : join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
      ...TOOL_PATHS.androidSdk.map((directory) => join(home, directory)),
    ]);

    const xcode =
      process.platform === 'darwin' ? findExistingPath([...TOOL_PATHS.xcode]) : null;

    const idb =
      process.platform === 'darwin'
        ? findOnPath({
            command: 'idb',
            directories: [...TOOL_PATHS.idb, join(home, '.local', 'bin')],
          })
        : null;

    this.detected = {
      androidSdk: { isFound: androidSdk !== null, path: androidSdk },
      xcode: { isFound: xcode !== null, path: xcode },
      idb: { isFound: idb !== null, path: idb },
    };

    return this.detected;
  }

  /** Drops the cache, so the next look sees what an install just put on disk. */
  public forget(): void {
    this.detected = null;
  }
}
