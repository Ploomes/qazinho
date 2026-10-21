import type { IRunEndNotice, IRunRef } from '@/shared/types';
import { app, Notification } from 'electron';

/** Calls the QA back when a run ends while they are elsewhere: a notification with its sound, and a count on the app's icon until they return. */
export class RunAlerts {
  private readonly onOpen: (run: IRunRef) => void;
  private readonly shown = new Set<Notification>();
  private unseen = 0;

  public constructor(onOpen: (run: IRunRef) => void) {
    this.onOpen = onOpen;
  }

  /** Alerts a run that ended, unless the QA is looking at the app, which tells them itself. */
  public alert(props: { notice: IRunEndNotice; isAway: boolean }): void {
    const { notice, isAway } = props;

    if (!isAway) return;

    this.unseen += 1;
    app.setBadgeCount(this.unseen);
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

  /** The QA came back to the app: the count on its icon goes. */
  public seen(): void {
    if (this.unseen === 0) return;

    this.unseen = 0;
    app.setBadgeCount(0);
  }
}
