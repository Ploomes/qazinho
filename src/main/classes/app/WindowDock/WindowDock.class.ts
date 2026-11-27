import type { IDockPlaces, IWindowDockProps } from './types';
import type { IWindowDock } from '@/shared/types';
import type { IWindowPlace } from '@ploomes/qazinho-harness/engine';
import type { BrowserWindow, Rectangle } from 'electron';
import { screen } from 'electron';
import { WINDOW } from '@/main/constants';
import { WINDOW_DOCK } from './constants';
import { dockOf } from './library';

/**
 * Encosta a janela do QAzinho numa coluna ao lado do Chrome em que o QA anda um caso à
 * mão, e a devolve como estava quando o caso acaba.
 */
export class WindowDock {
  private readonly props: IWindowDockProps;
  private docked: {
    workspaceId: string;
    bounds: Rectangle;
    wasMaximized: boolean;
  } | null = null;
  private ending: { timer: ReturnType<typeof setTimeout>; restore: () => void } | null =
    null;

  public constructor(props: IWindowDockProps) {
    this.props = props;
  }

  /** Encosta o QAzinho e diz onde o Chrome do caso abre; null se já há um encostado. */
  public async start(workspaceId: string): Promise<IWindowPlace | null> {
    const window = this.props.windowOf();

    this.finishEnding();

    if (window === null || window.isDestroyed() || this.docked !== null) return null;

    await this.leaveFullScreen(window);

    const wasMaximized = window.isMaximized();

    if (wasMaximized) window.unmaximize();

    const bounds = window.getNormalBounds();
    const places: IDockPlaces = dockOf(screen.getDisplayMatching(bounds).workArea);

    this.docked = { workspaceId, bounds, wasMaximized };
    window.setMinimumSize(WINDOW_DOCK.minColumn, WINDOW_DOCK.minHeight);
    window.setBounds(places.app, true);
    window.show();
    this.props.onChange({ workspaceId });

    return places.browser;
  }

  /**
   * Devolve o QAzinho ao tamanho e ao lugar de antes do caso, depois de um instante em
   * que a coluna mostra como ele foi.
   */
  public end(workspaceId: string): void {
    const docked = this.docked;

    if (docked?.workspaceId !== workspaceId || this.ending !== null) return;

    const restore = () => {
      this.ending = null;
      this.docked = null;
      this.props.onChange(null);

      const window = this.props.windowOf();

      if (window === null || window.isDestroyed()) return;

      window.setMinimumSize(WINDOW.minWidth, WINDOW.minHeight);
      window.setBounds(docked.bounds, true);

      if (docked.wasMaximized) window.maximize();

      window.show();
      window.focus();
    };

    this.ending = { timer: setTimeout(restore, WINDOW_DOCK.endHoldMs), restore };
  }

  /** O plano cujo caso à mão tem o QAzinho encostado agora. */
  public current(): IWindowDock | null {
    return this.docked === null ? null : { workspaceId: this.docked.workspaceId };
  }

  private finishEnding(): void {
    const ending = this.ending;

    if (ending === null) return;

    clearTimeout(ending.timer);
    ending.restore();
  }

  private leaveFullScreen(window: BrowserWindow): Promise<void> {
    if (!window.isFullScreen()) return Promise.resolve();

    return new Promise((left) => {
      const timer = setTimeout(left, WINDOW_DOCK.fullScreenWaitMs);

      window.once('leave-full-screen', () => {
        clearTimeout(timer);
        left();
      });
      window.setFullScreen(false);
    });
  }
}
