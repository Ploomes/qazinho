import type { RunEnd } from '@/modules/Run/types';

/**
 * A run's line in the chat, with how its steps went; an exploration also says how many
 * screens it reached and bugs it filed.
 */
export interface IRunMessage {
  id: string;
  kind: 'run';
  at: string;
  runId: string;
  passed: number;
  failed: number;
  endedBy: RunEnd;
  explored?: { screens: number; bugs: number };
}
