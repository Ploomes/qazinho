import type { IBug } from '@/modules/Bug/types';
import type { IKnownBug } from '@/shared/types';

/**
 * Os bugs abertos num workspace como os agentes de uma run ficam sabendo deles: por id,
 * título e onde foram pegos primeiro; um que o QA disse não ser bug não é contado.
 */
export function knownBugsOf(bugs: IBug[]): IKnownBug[] {
  return bugs
    .filter(({ isDismissed }) => !isDismissed)
    .map(({ id, title, caseId, stepNumber, isIncidental }) => ({
      id,
      title,
      caseId,
      stepNumber,
      isIncidental,
    }));
}
