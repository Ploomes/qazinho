import type { WindowFit } from '@/shared/types';

/** The only caller of the window side of the bridge. */
export class AppWindow {
  public static fit(fit: WindowFit): void {
    void window.qazinho?.fitWindow(fit);
  }
}
