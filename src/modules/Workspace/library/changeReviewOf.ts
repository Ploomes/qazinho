import type { IChangeReview } from '@/modules/Plan/types';

/** A revisão de trocas que um arquivo salvo guarda, ou null quando não guarda uma. */
export function changeReviewOf(saved: unknown): IChangeReview | null {
  const read = (saved ?? {}) as Record<string, unknown>;

  return typeof read.summary === 'string' &&
    typeof read.at === 'string' &&
    Array.isArray(read.items)
    ? {
        summary: read.summary,
        at: read.at,
        items: read.items.filter(
          (item): item is IChangeReview['items'][number] =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { id?: unknown }).id === 'string' &&
            ['change', 'add', 'doubt'].includes(
              String((item as { kind?: unknown }).kind),
            ),
        ),
      }
    : null;
}
