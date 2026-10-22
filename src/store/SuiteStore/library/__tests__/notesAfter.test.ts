import { describe, expect, it } from 'vitest';
import { notesAfter } from '@/store/SuiteStore/library';

const said = (text: string) => ({
  kind: 'line' as const,
  projectId: 'p-1',
  changeId: 'c-01',
  text,
});

describe('notesAfter', () => {
  it('adds what the agent said, trimmed, numbered after the last', () => {
    expect(
      notesAfter({
        notes: [{ id: 4, kind: 'said', text: 'Read ./tests' }],
        event: said('  ✎ ct-nav.spec.ts\n'),
      }),
    ).toEqual([
      { id: 4, kind: 'said', text: 'Read ./tests' },
      { id: 5, kind: 'said', text: '✎ ct-nav.spec.ts' },
    ]);
  });

  it('adds how the tests the agent ran went', () => {
    expect(
      notesAfter({
        notes: [],
        event: { kind: 'ran', projectId: 'p-1', changeId: 'c-01', total: 3, passed: 2 },
      }),
    ).toEqual([{ id: 1, kind: 'ran', total: 3, passed: 2 }]);
  });

  it('keeps nothing of a blank line', () => {
    expect(notesAfter({ notes: [], event: said('  ') })).toEqual([]);
  });

  it('keeps only the latest forty', () => {
    const notes = Array.from({ length: 40 }, (_, at) => ({
      id: at + 1,
      kind: 'said' as const,
      text: String(at),
    }));
    const after = notesAfter({ notes, event: said('40') });

    expect(after).toHaveLength(40);
    expect(after.at(-1)).toEqual({ id: 41, kind: 'said', text: '40' });
    expect(after[0]?.id).toBe(2);
  });
});
