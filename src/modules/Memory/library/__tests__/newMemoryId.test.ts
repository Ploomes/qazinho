import { describe, expect, it } from 'vitest';
import { newMemoryId } from '@/modules/Memory/library';

describe('newMemoryId', () => {
  it('is short enough for an agent to copy back', () => {
    expect(newMemoryId()).toMatch(/^m-[0-9a-f]{6}$/);
  });

  it('is a different one each time', () => {
    expect(newMemoryId()).not.toBe(newMemoryId());
  });
});
