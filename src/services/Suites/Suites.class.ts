import type {
  IStartSuiteChange,
  IStartSuiteRun,
  ISuite,
  ISuiteChange,
  ISuiteRun,
  SuiteChangeEvent,
  SuiteEvent,
  SuiteList,
  SuitePick,
  SuiteShipOutcome,
  SuiteShipWay,
} from '@/shared/types';

/** The only caller of the automation side of the bridge: the suite each project runs, kept by main. */
export class Suites {
  public static async pick(projectId: string): Promise<SuitePick> {
    return (await window.qazinho?.pickSuite(projectId)) ?? { kind: 'cancelled' };
  }

  public static async of(projectId: string): Promise<ISuite | null> {
    return (await window.qazinho?.suiteOf(projectId)) ?? null;
  }

  public static async list(projectId: string): Promise<SuiteList> {
    return (
      (await window.qazinho?.listSuite(projectId)) ?? {
        kind: 'failed',
        reason: 'no-suite',
        said: '',
      }
    );
  }

  public static run(start: IStartSuiteRun): void {
    void window.qazinho?.runSuite(start);
  }

  public static stop(projectId: string): void {
    void window.qazinho?.stopSuite(projectId);
  }

  public static async runs(projectId: string): Promise<ISuiteRun[]> {
    return (await window.qazinho?.suiteRuns(projectId)) ?? [];
  }

  public static async openTrace(trace: {
    projectId: string;
    runId: string;
    file: string;
  }): Promise<boolean> {
    return (await window.qazinho?.openSuiteTrace(trace)) ?? false;
  }

  public static onEvent(listener: (event: SuiteEvent) => void): () => void {
    return window.qazinho?.onSuiteEvent(listener) ?? (() => undefined);
  }

  public static async forget(projectId: string): Promise<void> {
    await window.qazinho?.forgetSuite(projectId);
  }

  public static async change(start: IStartSuiteChange): Promise<ISuiteChange | null> {
    return (await window.qazinho?.startSuiteChange(start).catch(() => null)) ?? null;
  }

  public static stopChange(changeId: string): void {
    void window.qazinho?.stopSuiteChange(changeId);
  }

  public static async changes(projectId: string): Promise<ISuiteChange[]> {
    return (await window.qazinho?.suiteChanges(projectId)) ?? [];
  }

  public static async ship(props: {
    projectId: string;
    changeId: string;
    way: SuiteShipWay;
  }): Promise<SuiteShipOutcome | null> {
    return (await window.qazinho?.shipSuiteChange(props).catch(() => null)) ?? null;
  }

  public static async discard(props: {
    projectId: string;
    changeId: string;
  }): Promise<ISuiteChange | null> {
    return (await window.qazinho?.discardSuiteChange(props)) ?? null;
  }

  public static onChangeEvent(listener: (event: SuiteChangeEvent) => void): () => void {
    return window.qazinho?.onSuiteChangeEvent(listener) ?? (() => undefined);
  }
}
