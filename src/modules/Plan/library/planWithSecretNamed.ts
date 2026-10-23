import type { ITestCase } from '@/modules/Plan/types';

/** The plan with a secret written out replaced by the variable that now keeps it, in every field a case and its steps hold. */
export function planWithSecretNamed(props: {
  plan: ITestCase[];
  value: string;
  name: string;
}): ITestCase[] {
  const named = (text: string) => text.split(props.value).join(`\${${props.name}}`);

  return props.plan.map((testCase) => ({
    ...testCase,
    title: named(testCase.title),
    goal: named(testCase.goal),
    preconditions: named(testCase.preconditions),
    steps: testCase.steps.map((step) => ({
      ...step,
      action: named(step.action),
      expected: named(step.expected),
    })),
  }));
}
