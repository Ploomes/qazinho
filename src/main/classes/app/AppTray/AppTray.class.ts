import type { IAppTray } from './types';
import type { ITrayWords } from '@/shared/types';
import { Menu, nativeImage, Tray } from 'electron';

/**
 * O ícone do QAzinho na bandeja do Windows e do Linux, onde o app fica com a janela
 * fechada: um clique a abre, e o menu também sai do app.
 */
export class AppTray {
  private readonly props: IAppTray;
  private tray: Tray | null = null;

  public constructor(props: IAppTray) {
    this.props = props;
  }

  /** Põe o ícone na bandeja com o menu nas palavras do QA, ou troca só as palavras. */
  public label(words: ITrayWords): void {
    const tray = this.tray ?? this.place();

    tray.setContextMenu(
      Menu.buildFromTemplate([
        { label: words.open, click: this.props.onOpen },
        { type: 'separator' },
        { label: words.quit, click: this.props.onQuit },
      ]),
    );
  }

  /** Tira o ícone da bandeja, quando o app sai. */
  public close(): void {
    this.tray?.destroy();
    this.tray = null;
  }

  private place(): Tray {
    const tray = new Tray(nativeImage.createFromPath(this.props.icon));

    tray.setToolTip('QAzinho');
    tray.on('click', this.props.onOpen);
    this.tray = tray;

    return tray;
  }
}
