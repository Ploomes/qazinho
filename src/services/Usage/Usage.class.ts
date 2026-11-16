import type { IUsageRecord } from '@/shared/types';

/** O único que pede à bridge o que as chamadas do QAzinho ao agente do QA gastaram. */
export class Usage {
  /** O que foi gasto desde um momento, ou nada sem a bridge. */
  public static async read(sinceMs: number): Promise<IUsageRecord[]> {
    return (await window.qazinho?.readUsage(sinceMs)) ?? [];
  }
}
