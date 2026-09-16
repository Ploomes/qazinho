import type { ITestCase } from '@/modules/Plan/types';
import { nextCaseId } from './nextCaseId';

/** A case the QA writes themselves, empty and waiting, at the end of the plan. */
export function addCase(plan: ITestCase[]): ITestCase[] {
  return [
    ...plan,
    {
      id: nextCaseId(plan),
      title: '',
      priority: 'P2',
      goal: '',
      preconditions: '',
      steps: [{ action: '', expected: '' }],
      lastVerdict: null,
    },
  ];
}
