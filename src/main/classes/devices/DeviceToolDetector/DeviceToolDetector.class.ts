import type { IDeviceTools } from '@/shared/types';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findExistingPath, findOnPath } from '@/main/library';
import { TOOL_PATHS } from './constants';

/** Procura o que um alvo de dispositivo precisa, e relata o que está aqui. */
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

    const axe =
      process.platform === 'darwin'
        ? findOnPath({
            command: 'axe',
            directories: [...TOOL_PATHS.axe, join(home, '.local', 'bin')],
          })
        : null;

    this.detected = {
      androidSdk: { isFound: androidSdk !== null, path: androidSdk },
      xcode: { isFound: xcode !== null, path: xcode },
      axe: { isFound: axe !== null, path: axe },
    };

    return this.detected;
  }

  /**
   * Descarta o cache, para a próxima olhada ver o que uma instalação acabou de pôr no
   * disco.
   */
  public forget(): void {
    this.detected = null;
  }
}
