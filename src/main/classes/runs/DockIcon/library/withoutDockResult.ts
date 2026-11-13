import type { IDockTally } from '@/main/classes/runs/DockIcon/types';
import { EMPTY_DOCK_TALLY } from '@/main/classes/runs/DockIcon/constants';

/** Tira da conta o resultado de uma rodada que o QA já viu, se nenhuma run anda. */
export function withoutDockResult(tally: IDockTally): IDockTally {
  if (Object.keys(tally.runs).length > 0 || tally.result === null) return tally;

  return EMPTY_DOCK_TALLY;
}
