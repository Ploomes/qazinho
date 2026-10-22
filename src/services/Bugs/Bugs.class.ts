import type { BugFiling, IFileBug, IFilingEvent } from '@/shared/types';

/** The only caller of the bug side of the bridge: a bug sent to the QA's tracker, each step as main takes it, and a screen copied for the QA to paste. */
export class Bugs {
  public static async file(request: IFileBug): Promise<BugFiling> {
    return (
      (await window.qazinho?.fileBug(request)) ?? {
        isFiled: false,
        failure: 'not-connected',
        said: '',
      }
    );
  }

  public static onFiling(listener: (event: IFilingEvent) => void): () => void {
    return window.qazinho?.onFilingEvent(listener) ?? (() => undefined);
  }

  public static async copyShot(shot: {
    file: string | null;
    src: string | null;
  }): Promise<boolean> {
    return (await window.qazinho?.copyShot(shot)) ?? false;
  }
}
