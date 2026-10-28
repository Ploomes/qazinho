import type { ITestCase } from '@/modules/Plan/types';

/**
 * O plano com um segredo escrito substituído pela variável que agora o guarda, em todo
 * campo que um caso e os passos dele guardam.
 */
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
