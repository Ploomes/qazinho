import type {
  BugComment,
  BugFiling,
  BugReview,
  ICommentBug,
  IFileBug,
  IFilingEvent,
  IReviewBug,
} from '@/shared/types';

/** The only caller of the bug side of the bridge: a bug sent to the QA's tracker, each step as main takes it, a screen copied for the QA to paste, and a bug that came back weighed against its issue and added to it. */
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

  public static async review(request: IReviewBug): Promise<BugReview> {
    return (
      (await window.qazinho?.reviewBug(request)) ?? {
        isReviewed: false,
        failure: 'agent',
        said: '',
      }
    );
  }

  public static async comment(request: ICommentBug): Promise<BugComment> {
    return (
      (await window.qazinho?.commentBug(request)) ?? {
        isPosted: false,
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
