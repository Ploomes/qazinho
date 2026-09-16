import { describe, expect, it } from 'vitest';
import { newProjectId } from '@/modules/Project/library';

describe('newProjectId', () => {
  it('names a project after the moment it was made', () => {
    expect(newProjectId(1_700_000_000_000)).toBe('p-1700000000000');
  });

  it('reads the clock when no moment is given', () => {
    expect(newProjectId()).toMatch(/^p-\d{13}$/);
  });
});
