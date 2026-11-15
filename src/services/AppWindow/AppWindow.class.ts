import type { ITrayWords, IWindowControls, IWindowDock, WindowFit } from '@/shared/types';

/** O único que chama o lado da janela da bridge. */
export class AppWindow {
  public static fit(fit: WindowFit): void {
    void window.qazinho?.fitWindow(fit);
  }

  public static paintControls(controls: IWindowControls): void {
    void window.qazinho?.paintWindowControls(controls);
  }

  public static labelTray(words: ITrayWords): void {
    void window.qazinho?.labelTray(words);
  }

  /** O plano cujo caso à mão tem a janela encostada ao lado do Chrome, se algum. */
  public static async dock(): Promise<IWindowDock | null> {
    return (await window.qazinho?.windowDock()) ?? null;
  }

  public static onDock(listener: (dock: IWindowDock | null) => void): () => void {
    return window.qazinho?.onWindowDock(listener) ?? (() => undefined);
  }
}
