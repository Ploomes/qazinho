import type { ITestCase } from '@/modules/Plan/types';

/**
 * O plano com um caso movido uma posição para cima ou para baixo; como estava quando o
 * caso já está nessa ponta.
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
