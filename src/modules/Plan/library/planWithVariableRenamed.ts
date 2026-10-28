import type { ITestCase } from '@/modules/Plan/types';

/**
 * O plano com todo ${NAME} de uma variável renomeada escrito com o nome novo, em todo
 * campo que um caso e os passos dele guardam.
 */
export function planWithVariableRenamed(props: {
  plan: ITestCase[];
  from: string;
  to: string;
}): ITestCase[] {
  const before = `\${${props.from}}`;
  const after = `\${${props.to}}`;
  const renamed = (text: string) => text.split(before).join(after);

  return props.plan.map((testCase) => ({
    ...testCase,
    title: renamed(testCase.title),
    goal: renamed(testCase.goal),
    preconditions: renamed(testCase.preconditions),
    steps: testCase.steps.map((step) => ({
      ...step,
      action: renamed(step.action),
      expected: renamed(step.expected),
    })),
  }));
}
