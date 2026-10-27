import type { ITestCase } from '@/modules/Plan/types';

/**
 * The plan with one case moved one place up or down; as it was when the case is already
 * at that end.
 */
export function moveCase(props: {
  plan: ITestCase[];
  caseId: string;
  by: -1 | 1;
}): ITestCase[] {
  const { plan, caseId, by } = props;
  const from = plan.findIndex(({ id }) => id === caseId);
  const to = from + by;

  if (from === -1 || to < 0 || to >= plan.length) return plan;

  const moved = [...plan];
  const [testCase] = moved.splice(from, 1);

  if (testCase !== undefined) moved.splice(to, 0, testCase);

  return moved;
}
