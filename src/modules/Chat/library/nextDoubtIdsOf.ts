import type { IPlanDoubt } from '@/shared/types';

/** Os ids das próximas dúvidas de um plano, D1, D2 e assim por diante, sem repetir um. */
export function nextDoubtIdsOf(props: { doubts: IPlanDoubt[]; count: number }): string[] {
  const highest = props.doubts.reduce((top, { id }) => {
    const number = Number(/^D(\d+)$/.exec(id)?.[1] ?? 0);

    return Number.isFinite(number) ? Math.max(top, number) : top;
  }, 0);

  return Array.from(
    { length: props.count },
    (_, index) => `D${String(highest + index + 1)}`,
  );
}
