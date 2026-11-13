import { describe, expect, it } from 'vitest';
import { nextDoubtIdsOf } from '@/modules/Chat/library/nextDoubtIdsOf';

const doubt = (id: string) => ({ id, question: '?', sent: null, answer: null });

describe('nextDoubtIdsOf', () => {
  it('numbers the first doubts of a plan from D1', () => {
    expect(nextDoubtIdsOf({ doubts: [], count: 2 })).toEqual(['D1', 'D2']);
  });

  it('goes on after the highest one, never reusing a gap', () => {
    expect(nextDoubtIdsOf({ doubts: [doubt('D1'), doubt('D4')], count: 1 })).toEqual([
      'D5',
    ]);
    expect(nextDoubtIdsOf({ doubts: [doubt('X')], count: 1 })).toEqual(['D1']);
  });
});
