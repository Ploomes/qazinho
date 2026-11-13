import type { IPlanDoubt } from '@/shared/types';

/** As dúvidas mandadas à história que o time ainda não respondeu, com onde foram. */
export function waitingDoubtsOf(
  doubts: IPlanDoubt[],
): { id: string; sent: { url: string; at: string } }[] {
  return doubts.flatMap(({ id, sent, answer }) =>
    sent === null || answer !== null ? [] : [{ id, sent }],
  );
}
