import type {
  DockIconKind,
  IDockTally,
  IDockView,
} from '@/main/classes/runs/DockIcon/types';
import { DOCK_ICON } from '@/main/classes/runs/DockIcon/constants';

/** O que o ícone mostra para a conta de agora, com as perguntas que esperam o QA. */
export function dockViewOf(props: { tally: IDockTally; unseen: number }): IDockView {
  const { tally, unseen } = props;
  const runs = Object.values(tally.runs);
  const total = runs.reduce((sum, run) => sum + run.total, 0);
  const walked = runs.reduce((sum, run) => sum + run.walked.length, 0);

  return {
    icon: iconOf({ tally, asking: runs.some((run) => run.asking) }),
    progress: total === 0 ? null : Math.min(1, walked / total),
    badge: badgeOf({ tally, unseen }),
  };
}

function iconOf(props: { tally: IDockTally; asking: boolean }): DockIconKind | null {
  const { tally, asking } = props;

  if (asking) return 'thinking';

  if (Object.keys(tally.runs).length > 0) return 'running';

  return tally.result;
}

function badgeOf(props: { tally: IDockTally; unseen: number }): string {
  const { tally, unseen } = props;

  if (tally.result === 'passed') return DOCK_ICON.passedBadge;

  if (tally.result === 'bug') return String(tally.failures);

  if (tally.result === 'broken') return DOCK_ICON.brokenBadge;

  return unseen > 0 ? String(unseen) : '';
}
