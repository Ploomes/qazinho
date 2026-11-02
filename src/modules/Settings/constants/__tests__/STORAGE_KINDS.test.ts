import { describe, expect, it } from 'vitest';
import { STORAGE_KINDS } from '@/modules/Settings/constants';

describe('STORAGE_KINDS', () => {
  it('leads with the videos, the one kind the QA can trim, and ends with the rest', () => {
    expect(STORAGE_KINDS.map(({ id }) => id)).toEqual([
      'videos',
      'screens',
      'builds',
      'other',
    ]);
  });

  it('names each kind in words the QA reads', () => {
    expect(
      STORAGE_KINDS.every(({ labelKey }) => labelKey.startsWith('SETTINGS.STORAGE_')),
    ).toBe(true);
  });
});
