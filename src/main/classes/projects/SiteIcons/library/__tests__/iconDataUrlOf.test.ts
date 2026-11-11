import { describe, expect, it } from 'vitest';
import { iconDataUrlOf } from '@/main/classes/projects/SiteIcons/library';

describe('iconDataUrlOf', () => {
  it('writes the bytes in base64 under their type', () => {
    expect(
      iconDataUrlOf({ bytes: new Uint8Array([137, 80, 78, 71]), type: 'image/png' }),
    ).toBe('data:image/png;base64,iVBORw==');
  });
});
