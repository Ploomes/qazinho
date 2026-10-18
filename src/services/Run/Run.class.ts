import type { IRunEvent, IRunInFlight, IStartRun, IViewport } from '@/shared/types';

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

  public static resize(props: { workspaceId: string; viewport: IViewport }): void {
    void window.qazinho?.resizeDevice(props);
  }

  public static async inFlight(): Promise<IRunInFlight[]> {
    return (await window.qazinho?.runsInFlight()) ?? [];
  }

  public static onEvent(listener: (event: IRunEvent) => void): () => void {
    return window.qazinho?.onRunEvent(listener) ?? (() => undefined);
  }
}
