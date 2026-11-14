import type { ITestCase, ReviewItem } from '@/modules/Plan/types';
import { planOfDraft } from './planOfDraft';

/**
 * O plano com uma troca aplicada: o caso tocado como fica, com o mesmo id, ou o caso novo
 * no fim; uma dúvida não muda o plano.
 */
export function planWithItem(props: {
  plan: ITestCase[];
  item: ReviewItem;
  used: string[];
}): ITestCase[] {
  const { plan, item } = props;

  if (item.kind === 'doubt') return plan;

  const [written] =
    planOfDraft({
      cases: [{ ...item.case, id: undefined }],
      plan: [],
      used: [...props.used, ...plan.map(({ id }) => id)],
    }) ?? [];

  if (written === undefined) return plan;

  if (item.kind === 'add') return [...plan, written];

  return plan.map((testCase) =>
    testCase.id === item.caseId
      ? {
          ...written,
          id: testCase.id,
          ...(testCase.isManual === true ? { isManual: true } : {}),
        }
      : testCase,
  );
}
