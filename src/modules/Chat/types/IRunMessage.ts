import type { RunEnd } from '@/modules/Run/types';

/**
 * A linha de uma run no chat, com como os passos dela foram; uma exploração também diz
 * quantas telas alcançou e bugs registrou.
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
