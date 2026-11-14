import { describe, expect, it } from 'vitest';
import { changeReviewOf, pendingChangeOf } from '@/modules/Workspace/library';

const FOUND = [
  {
    kind: 'story',
    key: 'SHOP-878',
    url: 'https://shop.atlassian.net/browse/SHOP-878',
    at: '2026-11-13T15:00:00.000Z',
    before: '3',
    after: '5',
    comments: [],
  },
];

describe('pendingChangeOf', () => {
  it('reads back what changed and how the sources read now', () => {
    expect(
      pendingChangeOf({ found: FOUND, snapshots: [], code: null, at: '2026-11-13' }),
    ).toEqual({ found: FOUND, snapshots: [], code: null, at: '2026-11-13' });
  });

  it('reads nothing from a file with no change in it', () => {
    expect(pendingChangeOf({ found: [], at: '2026-11-13' })).toBeNull();
    expect(pendingChangeOf(undefined)).toBeNull();
  });
});

describe('changeReviewOf', () => {
  it('reads back the swaps and how the QA decided them, without what someone broke', () => {
    expect(
      changeReviewOf({
        summary: 'Mudou.',
        at: '2026-11-13',
        items: [
          { id: 'R1', kind: 'doubt', question: 'Quanto?', state: 'open' },
          { id: 'R2', kind: 'nope' },
          null,
        ],
      }),
    ).toEqual({
      summary: 'Mudou.',
      at: '2026-11-13',
      items: [{ id: 'R1', kind: 'doubt', question: 'Quanto?', state: 'open' }],
    });
    expect(changeReviewOf({ items: [] })).toBeNull();
  });
});
