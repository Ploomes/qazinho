import type { IChangeReview } from '@/modules/Plan/types';
import type { IChangeRead } from '@/shared/types';

/** As trocas que o leitor de uma mudança propôs, cada uma aberta para o QA decidir. */
export function reviewOf(props: { read: IChangeRead; at: string }): IChangeReview {
  const { read } = props;
  const items = [
    ...read.changes.map((one) => ({
      kind: 'change' as const,
      caseId: one.caseId,
      why: one.why,
      case: one.case,
    })),
    ...read.added.map((one) => ({ kind: 'add' as const, why: one.why, case: one.case })),
    ...read.doubts.map((question) => ({ kind: 'doubt' as const, question })),
  ];

  return {
    summary: read.summary,
    at: props.at,
    items: items.map((item, index) => ({
      ...item,
      id: `R${String(index + 1)}`,
      state: 'open' as const,
    })),
  };
}
