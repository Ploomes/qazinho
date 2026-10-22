import type { ISuite, SuitePick } from '@/shared/types';

/** The only caller of the automation side of the bridge: the suite each project runs, kept by main. */
export class Suites {
  public static async pick(projectId: string): Promise<SuitePick> {
    return (await window.qazinho?.pickSuite(projectId)) ?? { kind: 'cancelled' };
  }

  public static async of(projectId: string): Promise<ISuite | null> {
    return (await window.qazinho?.suiteOf(projectId)) ?? null;
  }

  public static async forget(projectId: string): Promise<void> {
    await window.qazinho?.forgetSuite(projectId);
  }
}
