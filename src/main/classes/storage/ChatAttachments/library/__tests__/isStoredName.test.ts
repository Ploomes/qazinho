import { describe, expect, it } from 'vitest';
import { isStoredName } from '@/main/classes/storage/ChatAttachments/library';

describe('isStoredName', () => {
  it('takes a plain file name', () => {
    expect(isStoredName('a1-shot.png')).toBe(true);
  });

  it('does NOT take a path out of the folder, from the page', () => {
    for (const file of ['', '.', '..', '../x', 'a/b', 'a\\b', '..\\x'])
      expect(isStoredName(file)).toBe(false);
  });
});
