import type { ISuitePlanCase } from '@/modules/Automation/types';
import type { ITestCase } from '@/modules/Plan/types';

/** A case of a workspace's plan as the agent writing its test reads it: the workspace's name, and what the case says. */
export function planCaseOf(props: {
  workspace: string;
  testCase: ITestCase;
}): ISuitePlanCase {
  const { testCase } = props;

  return {
    workspace: props.workspace,
    id: testCase.id,
    title: testCase.title,
    goal: testCase.goal,
    preconditions: testCase.preconditions,
    steps: testCase.steps.map(({ action, expected }) => ({ action, expected })),
  };
}
