import type { ITestCase } from '@/modules/Plan/types';
import type { IDraftedCase } from '@/shared/types';
import { planOfDraft } from './planOfDraft';

/**
 * O plano com os casos escritos: um que nomeia um caso do plano o troca no lugar dele, e
 * os outros entram no fim; `null` quando nenhum caso sobra legível.
 */
export function planWithCases(props: {
  plan: ITestCase[];
  cases: IDraftedCase[];
  used: string[];
}): ITestCase[] | null {
  const { plan, cases, used } = props;

  return planOfDraft({
    cases: [
      ...plan.map((testCase) => cases.find(({ id }) => id === testCase.id) ?? testCase),
      ...cases.filter(({ id }) => !plan.some((one) => one.id === id)),
    ],
    plan,
    used,
  });
}
