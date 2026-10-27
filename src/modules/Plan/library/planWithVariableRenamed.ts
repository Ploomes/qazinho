import type { ITestCase } from '@/modules/Plan/types';

/**
 * The plan with every ${NAME} of a renamed variable written with its new name, in every
 * field a case and its steps hold.
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
