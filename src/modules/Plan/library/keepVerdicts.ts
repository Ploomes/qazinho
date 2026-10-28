import type { ITestCase } from '@/modules/Plan/types';

/**
 * Um plano novo, com o último veredito de todo caso que ele manteve palavra por palavra:
 * um caso que mudou ainda não rodou.
 */
export function keepVerdicts(props: {
  before: ITestCase[];
  after: ITestCase[];
}): ITestCase[] {
  return props.after.map((testCase) => ({
    ...testCase,
    lastVerdict:
      props.before.find((kept) => sameCase(kept, testCase))?.lastVerdict ??
      testCase.lastVerdict,
  }));
}

function sameCase(one: ITestCase, other: ITestCase): boolean {
  return (
    one.title === other.title &&
    one.steps.length === other.steps.length &&
    one.steps.every(
      (step, index) =>
        step.action === other.steps[index]?.action &&
        step.expected === other.steps[index]?.expected,
    )
  );
}
