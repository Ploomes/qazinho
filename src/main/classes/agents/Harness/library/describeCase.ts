import type { IFlatStep } from '@/shared/types';

/** One case to walk, as the message that starts the agent's turn: every step in order, and the screen it starts on. */
export function describeCase(props: { steps: IFlatStep[]; screen: string }): string {
  const { steps, screen } = props;
  const [first] = steps;

  if (first === undefined) return 'This case has no steps. End your turn.';

  return [
    `${first.caseId} · ${first.caseTitle}`,
    'Carry out these steps in order, and report each one as soon as you judged it:',
    ...steps.flatMap((step) => [
      `${String(step.numberInCase)}. ${step.action}`,
      `   The QA expects: ${step.expected}`,
    ]),
    ...(screen.length === 0 ? [] : ['', 'The device shows right now:', screen]),
  ].join('\n');
}
