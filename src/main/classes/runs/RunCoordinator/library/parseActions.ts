import type { IStepAction } from '@/types';

const KINDS = ['goto', 'click', 'fill', 'press', 'wait'];

type Answered = { actions?: { kind?: unknown; target?: unknown; value?: unknown }[] };

/** An action gocrash cannot carry out is not an action: it is dropped before the device sees it. */
export function parseActions(answer: string): IStepAction[] {
  let answered: Answered;

  try {
    answered = JSON.parse(answer) as Answered;
  } catch {
    return [];
  }

  return (answered.actions ?? []).flatMap<IStepAction>((one) => {
    const kind = typeof one.kind === 'string' ? one.kind : '';

    if (!KINDS.includes(kind)) return [];

    return [
      {
        kind: kind as IStepAction['kind'],
        target: typeof one.target === 'string' ? one.target : '',
        value: typeof one.value === 'string' ? one.value : '',
      },
    ];
  });
}
