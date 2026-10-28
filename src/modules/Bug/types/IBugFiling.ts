import type { FilingRow } from './FilingRow';
import type { FilingRowState } from './FilingRowState';
import type { BugFiling, IssueTarget } from '@/shared/types';

/**
 * Um bug a caminho do tracker do QA como o popup o mostra: para onde vai, a história a
 * que se liga, quantas telas vão junto, cada passo e em que pé está, e como terminou.
 */
export interface IBugFiling {
  filingId: string;
  bugId: string;
  target: IssueTarget;
  story: string | null;
  shots: number;
  steps: { row: FilingRow; state: FilingRowState }[];
  result: BugFiling | null;
}
