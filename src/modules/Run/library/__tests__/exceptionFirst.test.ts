import { describe, expect, it } from 'vitest';
import { exceptionFirst } from '@/modules/Run/library';

describe('exceptionFirst', () => {
  it('puts what failed first and what passed last', () => {
    const cases = [
      { id: 'a', verdict: 'passed' as const },
      { id: 'b', verdict: 'skipped' as const },
      { id: 'c', verdict: 'failed' as const },
      { id: 'd', verdict: 'blocked' as const },
    ];

    expect(exceptionFirst(cases).map(({ id }) => id)).toEqual(['c', 'd', 'b', 'a']);
  });

  it("keeps the plan's order among cases that went the same way", () => {
    const cases = [
      { id: 'a', verdict: 'passed' as const },
      { id: 'b', verdict: 'failed' as const },
      { id: 'c', verdict: 'passed' as const },
      { id: 'd', verdict: 'failed' as const },
    ];

    expect(exceptionFirst(cases).map(({ id }) => id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('does NOT change the list it was given', () => {
    const cases = [
      { id: 'a', verdict: 'passed' as const },
      { id: 'b', verdict: 'failed' as const },
    ];

    exceptionFirst(cases);

    expect(cases.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});
