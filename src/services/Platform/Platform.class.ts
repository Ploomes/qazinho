import type { Platform as PlatformName } from '@/shared/types';

/** The only reader of `window.qazinho.platform`. Views ask this, never the bridge. */
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
