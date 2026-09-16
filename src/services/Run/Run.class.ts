import type { IRunEvent, IStartRun } from '@/types';

/** The only caller of the run side of the bridge. */
export class Run {
  public static start(run: IStartRun): void {
    void window.gocrash?.startRun(run);
  }

  public static setPaused(props: { workspaceId: string; isPaused: boolean }): void {
    void window.gocrash?.pauseRun(props);
  }

  public static stop(workspaceId: string): void {
    void window.gocrash?.stopRun(workspaceId);
  }

  public static onEvent(listener: (event: IRunEvent) => void): () => void {
    return window.gocrash?.onRunEvent(listener) ?? (() => undefined);
  }
}
