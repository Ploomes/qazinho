import type { Platform as PlatformName } from '@/shared/types';

/**
 * O único que lê o `window.qazinho.platform`. As views perguntam a ele, nunca à bridge.
 */
export class Platform {
  public static current(): PlatformName | null {
    return window.qazinho?.platform ?? null;
  }

  public static isMac(): boolean {
    return Platform.current() === 'darwin';
  }

  public static isWindows(): boolean {
    return Platform.current() === 'win32';
  }
}
