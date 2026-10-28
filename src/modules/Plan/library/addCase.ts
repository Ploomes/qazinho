import type { ITestCase } from '@/modules/Plan/types';
import { nextCaseId } from './nextCaseId';

/**
 * Um caso que o próprio QA escreve, vazio e esperando, no fim do plano, com um id que
 * nenhuma run ou bug usou.
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
