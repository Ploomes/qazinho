import type { IWindowControls, WindowFit } from '@/shared/types';

/** O único que chama o lado da janela da bridge. */
export class AppWindow {
  public static fit(fit: WindowFit): void {
    void window.qazinho?.fitWindow(fit);
  }

  public static paintControls(controls: IWindowControls): void {
    void window.qazinho?.paintWindowControls(controls);
  }
}
