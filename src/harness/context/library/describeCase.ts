import type { IFlatStep, Language } from '@/shared/types';
import { LANGUAGE_NAMES } from '@/harness/constants';

/** One case to walk, as the message that starts the agent's turn: what it needs, every step in order, the language to report in, and the screen it starts on. */
export function describeCase(props: {
  steps: IFlatStep[];
  screen: string;
  language: Language;
}): string {
  const { steps, screen, language } = props;
  const [first] = steps;

  if (first === undefined) return 'This case has no steps. End your turn.';

  return [
    `${first.caseId} · ${first.caseTitle}`,
    ...(first.caseGoal.length > 0 ? [`Goal: ${first.caseGoal}`] : []),
    ...(first.casePreconditions.length > 0
      ? [`Preconditions: ${first.casePreconditions}`]
      : []),
    'Carry out these steps in order, and report each one as soon as you judged it:',
    ...steps.flatMap((step) => [
      `${String(step.numberInCase)}. ${step.action}`,
      `   The QA expects: ${step.expected}`,
    ]),
    `Write what you report and note in ${LANGUAGE_NAMES[language]}, whatever language these steps are in.`,
    ...(screen.length === 0 ? [] : ['', 'The device shows right now:', screen]),
  ].join('\n');
}
