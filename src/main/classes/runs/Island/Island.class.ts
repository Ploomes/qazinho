import type { IIslandWindow, NotchReading } from './types';
import type { IIsland, IslandAction, IIslandFrame } from '@/shared/types';
import { BrowserWindow, ipcMain, screen } from 'electron';
import { execCommand } from '@/main/library';
import { CHANNELS, ISLAND_ARGUMENT } from '@/shared/constants';
import { ISLAND_WINDOW } from './constants';
import { islandBehaviorOf, islandPlaceOf, measureNotch } from './library';

/**
 * A ilha que fica no topo da tela, onde o notch está: uma janela transparente que mostra
 * o que a run faz e deixa o QA agir sem abrir o app.
 */
export class Island {
  private readonly preload: string;
  private readonly page: IIslandWindow['page'];
  private readonly onAction: IIslandWindow['onAction'];
  private window: BrowserWindow | null = null;
  private isLoaded = false;
  private frame: IIslandFrame | null = null;
  private readonly behavior = islandBehaviorOf(process.platform);
  private hasKeyboard = false;
  private release: ReturnType<typeof setTimeout> | null = null;
  private notch: NotchReading = 'unknown';
  private measuredScreen = '';

  public constructor(props: IIslandWindow) {
    this.preload = props.preload;
    this.page = props.page;
    this.onAction = props.onAction;

    ipcMain.on(CHANNELS.islandSet, (_event, island: IIsland) => {
      this.set(island);
    });
    ipcMain.on(CHANNELS.islandHover, (_event, isOver: boolean) => {
      this.window?.setIgnoreMouseEvents(!isOver, { forward: true });
    });
    ipcMain.on(CHANNELS.islandKeyboard, (_event, isWanted: boolean) => {
      this.askKeyboard(isWanted);
    });
    ipcMain.on(CHANNELS.islandAct, (_event, action: IslandAction) => {
      this.onAction(action);
    });
  }

  /** Se uma janela é a ilha, que as janelas do próprio app deixam de fora. */
  public owns(window: BrowserWindow): boolean {
    return window === this.window;
  }

  /** Mostra o que a página mandou, ou esconde a ilha quando não há nada a dizer. */
  public set(island: IIsland): void {
    if (island.state.kind === 'idle') {
      this.frame = { island, barHeight: 0, notchWidth: 0 };
      this.send();
      this.giveKeyboardBack();
      this.window?.hide();

      return;
    }

    const window = this.open();
    const display = screen.getPrimaryDisplay();

    this.measure(`${String(display.id)}:${JSON.stringify(display.bounds)}`);

    const place = islandPlaceOf({
      bounds: display.bounds,
      workArea: display.workArea,
      platform: process.platform,
      notch: this.notch,
    });

    window.setBounds({
      x: place.x,
      y: place.y,
      width: place.width,
      height: place.height,
    });
    this.frame = {
      island,
      barHeight: place.barHeight,
      notchWidth: place.notchWidth,
    };
    this.send();

    if (!window.isVisible()) window.showInactive();
  }

  /** Fecha a janela da ilha de vez, na saída do app. */
  public close(): void {
    if (this.window && !this.window.isDestroyed()) this.window.destroy();

    this.window = null;
  }

  private measure(screenKey: string): void {
    if (screenKey === this.measuredScreen) return;

    this.measuredScreen = screenKey;
    this.notch = 'unknown';

    void measureNotch({ platform: process.platform, run: execCommand }).then((notch) => {
      if (screenKey !== this.measuredScreen || notch === 'unknown') return;

      this.notch = notch;

      if (this.frame !== null && this.frame.island.state.kind !== 'idle')
        this.set(this.frame.island);
    });
  }

  private askKeyboard(isWanted: boolean): void {
    if (this.release !== null) clearTimeout(this.release);

    this.release = null;

    if (!isWanted) {
      this.release = setTimeout(() => {
        this.giveKeyboardBack();
      }, ISLAND_WINDOW.keyboardReleaseMs);

      return;
    }

    if (this.window === null || this.window.isDestroyed()) return;

    if (this.behavior.togglesFocus) this.window.setFocusable(true);

    this.window.focus();
    this.window.webContents.focus();
    this.hasKeyboard = true;
  }

  private giveKeyboardBack(): void {
    if (this.release !== null) clearTimeout(this.release);

    this.release = null;

    if (!this.hasKeyboard || this.window === null || this.window.isDestroyed()) return;

    this.hasKeyboard = false;
    this.window.blur();

    if (this.behavior.togglesFocus) this.window.setFocusable(false);
  }

  private send(): void {
    if (this.isLoaded && this.frame !== null && this.window !== null)
      this.window.webContents.send(CHANNELS.islandFrame, this.frame);
  }

  private open(): BrowserWindow {
    if (this.window && !this.window.isDestroyed()) return this.window;

    const window = new BrowserWindow({
      width: ISLAND_WINDOW.width,
      height: ISLAND_WINDOW.height,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      resizable: false,
      movable: false,
      skipTaskbar: true,
      show: false,
      roundedCorners: false,
      ...this.behavior.options,
      webPreferences: {
        preload: this.preload,
        contextIsolation: true,
        sandbox: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        additionalArguments: [ISLAND_ARGUMENT],
      },
    });

    window.setAlwaysOnTop(true, ISLAND_WINDOW.level);

    if (this.behavior.joinsSpaces)
      window.setVisibleOnAllWorkspaces(true, {
        visibleOnFullScreen: true,
        skipTransformProcessType: true,
      });

    window.setIgnoreMouseEvents(true, { forward: true });
    window.webContents.on('will-navigate', (event) => {
      event.preventDefault();
    });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('did-finish-load', () => {
      this.isLoaded = true;
      this.send();
    });
    window.on('closed', () => {
      this.window = null;
      this.isLoaded = false;
      this.hasKeyboard = false;
    });

    this.window = window;
    this.isLoaded = false;
    void ('url' in this.page
      ? window.loadURL(this.page.url)
      : window.loadFile(this.page.file));

    return window;
  }
}
