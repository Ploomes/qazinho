import type { FilingChange, FilingRowState, IBugFiling } from '@/modules/Bug/types';

/**
 * A bug's sending after one change: the evidence ready, a step main told of, or how it
 * ended, the step still going marked failed when it ended badly.
 */
export function filingAfter(props: {
  filing: IBugFiling;
  change: FilingChange;
}): IBugFiling {
  const { filing, change } = props;
  const marked = (row: string, state: FilingRowState) =>
    filing.steps.map((step) => (step.row === row ? { ...step, state } : step));

  if (change.kind === 'ready') return { ...filing, steps: marked('ready', 'done') };

  if (change.kind === 'step') {
    if (change.event.filingId !== filing.filingId) return filing;

    return { ...filing, steps: marked(change.event.step, change.event.state) };
  }

  const stuck =
    filing.steps.findLast(({ state }) => state === 'working') ??
    filing.steps.find(({ state }) => state === 'pending');

  return {
    ...filing,
    result: change.result,
    steps:
      change.result.isFiled || stuck === undefined
        ? filing.steps
        : filing.steps.map((step) =>
            step.row === stuck.row ? { ...step, state: 'failed' } : step,
          ),
  };
}
