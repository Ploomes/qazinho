import type { IRunEvent, IStartRun } from '@/shared/types';

/** The only caller of the run side of the bridge. */
export class Run {
  public static start(run: IStartRun): void {
    void window.qazinho?.startRun(run);
  }

  public static setPaused(props: { workspaceId: string; isPaused: boolean }): void {
    void window.qazinho?.pauseRun(props);
  }

  public static stop(workspaceId: string): void {
    void window.qazinho?.stopRun(workspaceId);
  }

  public static onEvent(listener: (event: IRunEvent) => void): () => void {
    return window.qazinho?.onRunEvent(listener) ?? (() => undefined);
  }
}
