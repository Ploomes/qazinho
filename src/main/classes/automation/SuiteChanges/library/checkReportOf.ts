import type { ICheckedTest } from '@/main/classes/automation/SuiteChanges/types';
import type { IVariableValue } from '@/main/types';
import type { ISuiteResult, SuiteFailure } from '@/shared/types';
import { SUITE_CHANGES } from '@/main/classes/automation/SuiteChanges/constants';
import { hiddenValues } from '@/main/classes/runs/RunCoordinator/library/hiddenValues';

const NONE_RAN: Record<SuiteFailure, string> = {
  'no-suite': 'No test ran: the suite is gone.',
  'no-runner': "No test ran: the suite's Playwright is not in this copy.",
  'no-node': 'No test ran: QAzinho found no Node.js on this machine.',
  unreadable: 'No test ran: Playwright could not read the suite.',
};

function endOf(result: ISuiteResult): string {
  if (result.status === 'passed') return result.isFlaky ? 'passed on a retry' : 'passed';

  return result.status === 'timedOut' ? 'timed out' : result.status;
}

/** What the agent reads after running tests: how many ran and how each ended, a failure's error, what Playwright noted and where its screenshots are, each secret read back as its name. */
export function checkReportOf(props: {
  tests: ICheckedTest[];
  failure: SuiteFailure | null;
  said: string;
  values: IVariableValue[];
}): string {
  const { tests } = props;
  const count = (ended: string) =>
    tests.filter(({ result }) => endOf(result).startsWith(ended)).length;
  const lines =
    tests.length === 0
      ? [
          props.failure === null ? 'No test ran.' : NONE_RAN[props.failure],
          ...(props.said === '' ? [] : ['Playwright said:', '```', props.said, '```']),
        ]
      : [
          `Ran ${String(tests.length)} ${tests.length === 1 ? 'test' : 'tests'}: ${String(count('passed'))} passed, ${String(tests.length - count('passed') - count('skipped'))} failed, ${String(count('skipped'))} skipped.`,
          ...tests.flatMap(({ result, notes, screenshots }) => [
            '',
            `### ${result.title}`,
            `${result.file}:${String(result.line)}${result.project === '' ? '' : `, project ${result.project}`}: ${endOf(result)} in ${(result.durationMs / 1000).toFixed(1)} s.`,
            ...(result.error === null ? [] : ['Error:', '```', result.error, '```']),
            ...(notes === ''
              ? []
              : ['What Playwright noted when it failed:', '````markdown', notes, '````']),
            ...screenshots.map((file) => `Screenshot: ${file}`),
          ]),
        ];

  return hiddenValues({ text: lines.join('\n'), values: props.values }).slice(
    0,
    SUITE_CHANGES.reportChars,
  );
}
