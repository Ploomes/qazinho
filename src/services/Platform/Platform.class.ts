import type { Platform as PlatformName } from '@/types';

/** The only reader of `window.gocrash.platform`. Views ask this, never the bridge. */
export class Platform {
  public static current(): PlatformName | null {
    return window.gocrash?.platform ?? null;
  }

  public static isMac(): boolean {
    return Platform.current() === 'darwin';
  }
}
