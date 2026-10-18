import type { RunEnd } from '@/modules/Run/types';

export interface IRunMessage {
  id: string;
  kind: 'run';
  at: string;
  runId: string;
  passed: number;
  failed: number;
  endedBy: RunEnd;
}
