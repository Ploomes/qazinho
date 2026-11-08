import { describe, expect, it } from 'vitest';
import { useRunActivityViewModel } from '@/modules/Chat/screens/Chat/components/RunActivity/hooks';

const line = (id: number, isBug = false) => ({ id, text: `line ${String(id)}`, isBug });

describe('the lines of what the agent is doing', () => {
  it('marks only the newest as what it does now', () => {
    const { rows } = useRunActivityViewModel({ lines: [line(1), line(2)] });

    expect(rows.map(({ isNow }) => isNow)).toEqual([false, true]);
  });

  it('dresses a caught bug, even when it is no longer the newest', () => {
    const { rows } = useRunActivityViewModel({ lines: [line(1, true), line(2)] });

    expect(rows[0]?.className).toContain('run-activity__line--bug');
    expect(rows[1]?.className).not.toContain('run-activity__line--bug');
  });

  it('puts what the agent said first, apart from what it is doing', () => {
    const { rows } = useRunActivityViewModel({
      lines: [line(1), { ...line(2), isSay: true }, line(3)],
    });

    expect(rows.map(({ id }) => id)).toEqual([2, 1, 3]);
    expect(rows[0]?.className).toContain('run-activity__line--say');
    expect(rows[2]?.isNow).toBe(true);
  });

  it('has nothing to draw with no lines', () => {
    expect(useRunActivityViewModel({ lines: [] }).rows).toEqual([]);
  });
});
