import type { IRunAlert, IRunRef } from '@/shared/types';
import { app, Notification } from 'electron';

/**
 * Chama o QA de volta quando uma run termina ou lhe pergunta algo: uma notificação, e um
 * badge no ícone.
 */
export class RunAlerts {
  private readonly onOpen: (run: IRunRef) => void;
  private readonly onUnseen: (unseen: number) => void;
  private readonly shown = new Set<Notification>();
  private unseen = 0;

  public constructor(props: {
    onOpen: (run: IRunRef) => void;
    onUnseen: (unseen: number) => void;
  }) {
    this.onOpen = props.onOpen;
    this.onUnseen = props.onUnseen;
  }

  /**
   * Alerta o que uma run diz, a menos que o QA esteja olhando o app, que lhe diz por si
   * mesmo.
   */
  public alert(props: { notice: IRunAlert; isAway: boolean }): void {
    const { notice, isAway } = props;

    if (!isAway) return;

    this.unseen += 1;
    this.onUnseen(this.unseen);
    app.dock?.bounce('informational');

    if (!Notification.isSupported()) return;

    const notification = new Notification({
      title: notice.title,
      body: notice.body,
      silent: false,
    });
    const forget = () => {
      this.shown.delete(notification);
    };

    notification.on('click', () => {
      forget();
      this.onOpen({ workspaceId: notice.workspaceId, runId: notice.runId });
    });
    notification.on('close', forget);
    this.shown.add(notification);
    notification.show();
  }

  /** O QA voltou ao app: a contagem no ícone dele some. */
  public seen(): void {
    if (this.unseen === 0) return;

    this.unseen = 0;
    this.onUnseen(0);
  }
}
