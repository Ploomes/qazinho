import type { ISuitePlanCase } from '@/modules/Automation/types';
import type { ITestCase } from '@/modules/Plan/types';

/**
 * Um caso do plano de um workspace como o agente que escreve o teste dele o lê: o nome do
 * workspace, e o que o caso diz.
 */
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
