import type { IDockTally } from '@/main/classes/runs/DockIcon/types';

export const EMPTY_DOCK_TALLY: IDockTally = {
  runs: {},
  failures: 0,
  crashed: false,
  result: null,
};
