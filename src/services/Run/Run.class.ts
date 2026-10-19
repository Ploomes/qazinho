import type {
  IRunEvent,
  IRunInFlight,
  IRunRef,
  IStartRun,
  IViewport,
  SaveOutcome,
} from '@/shared/types';

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

  public static focus(props: { workspaceId: string; isFocused: boolean }): void {
    void window.qazinho?.focusDevice(props);
  }

  public static async inFlight(): Promise<IRunInFlight[]> {
    return (await window.qazinho?.runsInFlight()) ?? [];
  }

  public static onEvent(listener: (event: IRunEvent) => void): () => void {
    return window.qazinho?.onRunEvent(listener) ?? (() => undefined);
  }

  public static async replayUrl(run: IRunRef): Promise<string | null> {
    return (await window.qazinho?.replayUrl(run)) ?? null;
  }

  public static async saveReplay(
    props: IRunRef & { name: string },
  ): Promise<SaveOutcome> {
    return (await window.qazinho?.saveReplay(props)) ?? 'failed';
  }
}
