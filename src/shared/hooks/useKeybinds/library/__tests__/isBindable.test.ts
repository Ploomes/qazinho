import { describe, expect, it } from 'vitest';
import { isBindable } from '@/shared/hooks/useKeybinds/library';

describe('isBindable', () => {
  it('takes a combo held with Command or Option', () => {
    expect(isBindable('⌘K')).toBe(true);
    expect(isBindable('⌥⇧P')).toBe(true);
  });

  it('does NOT take a key alone, which would fire while the QA types', () => {
    expect(isBindable('A')).toBe(false);
    expect(isBindable('↵')).toBe(false);
  });

  it('does NOT take Shift alone, which only makes a capital', () => {
    expect(isBindable('⇧A')).toBe(false);
  });
});
