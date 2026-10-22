import type { ISuiteChange } from '@/modules/Automation/types';

/** The latest change the agent made for a test that the QA has not thrown away; null when there is none. */
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
