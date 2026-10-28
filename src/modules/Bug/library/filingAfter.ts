import type { FilingChange, FilingRowState, IBugFiling } from '@/modules/Bug/types';

/**
 * O envio de um bug depois de uma mudança: a evidência pronta, um passo de que a main
 * avisou, ou como terminou, o passo ainda andando marcado como falho quando terminou mal.
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
