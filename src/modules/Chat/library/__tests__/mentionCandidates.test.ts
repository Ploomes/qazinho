import type { IChatReference } from '@/types';
import { describe, expect, it } from 'vitest';
import { mentionCandidates } from '@/modules/Chat/library';

function reference(id: string, title: string): IChatReference {
  return { kind: 'run', id, title, facts: [] };
}

const REFERENCES = [
  reference('R-02', 'The whole plan'),
  reference('R-01', 'Checkout only'),
  reference('BUG-01', 'Coupon field accepts expired codes'),
];

describe('mentionCandidates', () => {
  it('offers everything the moment the QA types a bare @', () => {
    expect(mentionCandidates({ references: REFERENCES, query: '' })).toEqual(REFERENCES);
  });

  it('narrows to the ids that hold what was typed, in any case', () => {
    expect(
      mentionCandidates({ references: REFERENCES, query: 'r-0' }).map(({ id }) => id),
    ).toEqual(['R-02', 'R-01']);
  });

  it('finds a reference by its title too', () => {
    expect(
      mentionCandidates({ references: REFERENCES, query: 'coupon' }).map(({ id }) => id),
    ).toEqual(['BUG-01']);
  });

  it('offers nothing when the QA is not mentioning', () => {
    expect(mentionCandidates({ references: REFERENCES, query: null })).toEqual([]);
  });

  it('never offers more than eight, so the picker stays a short list', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      reference(`R-${String(index)}`, 'run'),
    );

    expect(mentionCandidates({ references: many, query: '' })).toHaveLength(8);
  });
});
