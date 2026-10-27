import type { ITestCase } from '@/modules/Plan/types';
import { nextCaseId } from './nextCaseId';

/**
 * A case the QA writes themselves, empty and waiting, at the end of the plan, with an id
 * no run or bug used.
 */
export function addCase(props: { plan: ITestCase[]; used: string[] }): ITestCase[] {
  return [
    ...props.plan,
    {
      id: nextCaseId([...props.used, ...props.plan.map(({ id }) => id)]),
      title: '',
      priority: 'P2',
      goal: '',
      preconditions: '',
      steps: [{ action: '', expected: '' }],
      lastVerdict: null,
    },
  ];
}
