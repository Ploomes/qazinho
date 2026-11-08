import { describe, expect, it } from 'vitest';
import { isStillPath } from '@/main/classes/devices/LiveStream/library/isStillPath';

describe('isStillPath', () => {
  it('knows a request for the picture of now', () => {
    expect(isStillPath('/token/w-1~2?still=12')).toBe(true);
  });

  it('leaves the stream alone', () => {
    expect(isStillPath('/token/w-1~2')).toBe(false);
    expect(isStillPath('/token/w-1?other=1')).toBe(false);
  });
});
