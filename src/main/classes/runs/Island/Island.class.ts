import type { IIslandWindow } from './types';
import type { IIsland, IIslandAction, IIslandFrame } from '@/shared/types';
import { BrowserWindow, ipcMain, screen } from 'electron';
import { CHANNELS, ISLAND_ARGUMENT } from '@/shared/constants';
import { ISLAND_WINDOW } from './constants';
import { islandPlaceOf } from './library';

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
    ipcMain.on(CHANNELS.islandAct, (_event, action: IIslandAction) => {
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
      this.window?.hide();
      this.frame = null;

      return;
    }

    const window = this.open();
    const display = screen.getPrimaryDisplay();
    const place = islandPlaceOf({
      bounds: display.bounds,
      workArea: display.workArea,
      platform: process.platform,
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
      hasShadow: false,
      resizable: false,
      movable: false,
      focusable: false,
      skipTaskbar: true,
      show: false,
      roundedCorners: false,
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

    if (process.platform !== 'win32')
      window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

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
    });

    this.window = window;
    this.isLoaded = false;
    void ('url' in this.page
      ? window.loadURL(this.page.url)
      : window.loadFile(this.page.file));

    return window;
  }
}
