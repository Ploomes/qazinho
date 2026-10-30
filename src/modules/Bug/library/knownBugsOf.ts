import type { IBug } from '@/modules/Bug/types';
import type { IKnownBug } from '@/shared/types';

/**
 * Os bugs de um workspace como os agentes de uma run ficam sabendo deles: id, título,
 * onde foram pegos, e se o QA disse que não são bugs.
 */
export function knownBugsOf(bugs: IBug[]): IKnownBug[] {
  return bugs.map(({ id, title, caseId, stepNumber, isIncidental, isDismissed }) => ({
    id,
    title,
    caseId,
    stepNumber,
    isIncidental,
    ...(isDismissed ? { isDismissed: true } : {}),
  }));
}
