import type { IDockTally } from '@/main/classes/runs/DockIcon/types';
import { EMPTY_DOCK_TALLY } from '@/main/classes/runs/DockIcon/constants';

/** Põe uma run que começou na conta; sem outra andando, o resultado anterior some. */
export function withDockRun(props: {
  tally: IDockTally;
  workspaceId: string;
  total: number;
}): IDockTally {
  const { tally, workspaceId, total } = props;

  if (tally.runs[workspaceId]) return tally;

  const fresh = Object.keys(tally.runs).length === 0 ? EMPTY_DOCK_TALLY : tally;

  return {
    ...fresh,
    runs: {
      ...fresh.runs,
      [workspaceId]: { total, walked: [], failed: [], asking: false },
    },
  };
}
