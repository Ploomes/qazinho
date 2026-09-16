import { describe, expect, it } from 'vitest';
import { isNearBottom } from '@/modules/Chat/screens/Chat/library';

describe('isNearBottom', () => {
  it('follows a reader at the very end', () => {
    expect(
      isNearBottom({ scrollTop: 600, clientHeight: 400, scrollHeight: 1000, edgePx: 80 }),
    ).toBe(true);
  });

  it('still follows a reader a few lines short of the end', () => {
    expect(
      isNearBottom({ scrollTop: 540, clientHeight: 400, scrollHeight: 1000, edgePx: 80 }),
    ).toBe(true);
  });

  it('does NOT pull down a reader who scrolled up to read', () => {
    expect(
      isNearBottom({ scrollTop: 200, clientHeight: 400, scrollHeight: 1000, edgePx: 80 }),
    ).toBe(false);
  });
});
