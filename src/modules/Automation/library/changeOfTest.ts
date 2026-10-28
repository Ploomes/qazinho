import type { ISuiteChange } from '@/modules/Automation/types';

/**
 * A última mudança que o agente fez para um teste e que o QA não jogou fora; null quando
 * não há.
 */
export function changeOfTest(props: {
  changes: ISuiteChange[];
  testId: string;
}): ISuiteChange | null {
  return (
    props.changes
      .filter(
        ({ ask, status }) =>
          ask.kind === 'fix' && ask.test.id === props.testId && status !== 'discarded',
      )
      .sort((one, other) => other.startedAt - one.startedAt)[0] ?? null
  );
}
