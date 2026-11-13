import type {
  DockResult,
  IDockRun,
  IDockTally,
} from '@/main/classes/runs/DockIcon/types';
import type { IRunEvent } from '@/shared/types';

/** Soma na conta o que um evento de run diz: um passo andado, uma pergunta, ou o fim. */
export function withDockEvent(props: {
  tally: IDockTally;
  event: IRunEvent;
}): IDockTally {
  const { tally, event } = props;

  if (event.kind === 'step') return withStep({ tally, event });

  if (event.kind === 'asked')
    return withAsking({ tally, id: event.workspaceId, to: true });

  if (event.kind === 'answered')
    return withAsking({ tally, id: event.workspaceId, to: false });

  if (event.kind === 'done' || event.kind === 'failed')
    return withEnd({
      tally,
      workspaceId: event.workspaceId,
      crashed: event.kind === 'failed',
    });

  return tally;
}

function withAsking(props: { tally: IDockTally; id: string; to: boolean }): IDockTally {
  const { tally, id, to } = props;
  const run = tally.runs[id];

  if (!run || run.asking === to) return tally;

  return { ...tally, runs: { ...tally.runs, [id]: { ...run, asking: to } } };
}

function withStep(props: {
  tally: IDockTally;
  event: Extract<IRunEvent, { kind: 'step' }>;
}): IDockTally {
  const { tally, event } = props;
  const { workspaceId, index, verdict } = event.outcome;
  const run = tally.runs[workspaceId];

  if (!run || !isSettled(verdict)) return tally;

  const next: IDockRun = {
    ...run,
    walked: run.walked.includes(index) ? run.walked : [...run.walked, index],
    failed:
      verdict === 'failed' && !run.failed.includes(index)
        ? [...run.failed, index]
        : run.failed,
  };

  return { ...tally, runs: { ...tally.runs, [workspaceId]: next } };
}

function withEnd(props: {
  tally: IDockTally;
  workspaceId: string;
  crashed: boolean;
}): IDockTally {
  const { tally, workspaceId, crashed } = props;
  const run = tally.runs[workspaceId];

  if (!run) return tally;

  const { [workspaceId]: _ended, ...runs } = tally.runs;
  const failures = tally.failures + run.failed.length;
  const broke = tally.crashed || crashed;

  return {
    runs,
    failures,
    crashed: broke,
    result: Object.keys(runs).length > 0 ? null : resultOf({ failures, broke }),
  };
}

function resultOf(props: { failures: number; broke: boolean }): DockResult {
  if (props.broke) return 'broken';

  return props.failures > 0 ? 'bug' : 'passed';
}

function isSettled(verdict: string): boolean {
  return verdict !== 'pending' && verdict !== 'running';
}
