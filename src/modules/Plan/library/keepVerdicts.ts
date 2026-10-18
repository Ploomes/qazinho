import type { ITestCase } from '@/modules/Plan/types';

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

/** A new plan, with the last verdict of every case it kept word for word: a case that changed has not run yet. */
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
