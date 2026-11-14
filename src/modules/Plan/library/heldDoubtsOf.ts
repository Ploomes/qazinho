import type { ITestCase } from '@/modules/Plan/types';
import type { IPlanDoubt } from '@/shared/types';

/** As dúvidas que o time respondeu e que ainda seguram casos do plano, com os casos. */
export function heldDoubtsOf(props: {
  plan: ITestCase[];
  doubts: IPlanDoubt[];
}): { id: string; caseIds: string[] }[] {
  return props.doubts.flatMap(({ id, answer }) => {
    const caseIds = props.plan
      .filter(({ blockedBy }) => blockedBy?.includes(id) === true)
      .map((testCase) => testCase.id);

    return answer === null || caseIds.length === 0 ? [] : [{ id, caseIds }];
  });
}
