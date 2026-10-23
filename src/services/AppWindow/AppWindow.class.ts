import type { IWindowControls, WindowFit } from '@/shared/types';

/** The only caller of the window side of the bridge. */
export class AppWindow {
  public static fit(fit: WindowFit): void {
    void window.qazinho?.fitWindow(fit);
  }

  public static paintControls(controls: IWindowControls): void {
    void window.qazinho?.paintWindowControls(controls);
  }
}
