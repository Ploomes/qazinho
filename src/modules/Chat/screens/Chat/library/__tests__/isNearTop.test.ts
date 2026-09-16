import { describe, expect, it } from 'vitest';
import { isNearTop } from '@/modules/Chat/screens/Chat/library';

describe('isNearTop', () => {
  it('asks for older messages once the reader nears the start', () => {
    expect(isNearTop({ scrollTop: 40, edgePx: 80 })).toBe(true);
  });

  it('does NOT ask while the reader is further down', () => {
    expect(isNearTop({ scrollTop: 300, edgePx: 80 })).toBe(false);
  });
});
