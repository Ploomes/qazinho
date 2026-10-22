import { describe, expect, it } from 'vitest';
import { frameUrlOf } from '@/modules/Plan/library';

const DESIGN = {
  url: 'https://www.figma.com/design/AbC123/Shop?node-id=1-2&t=k9',
  fileKey: 'AbC123',
  nodeId: '1:2',
  name: 'Shop',
};

describe('frameUrlOf', () => {
  it('opens the frame a step names in the same design', () => {
    expect(frameUrlOf({ design: DESIGN, frame: '12:345' })).toBe(
      'https://www.figma.com/design/AbC123/Shop?node-id=12-345&t=k9',
    );
  });

  it('adds the frame to a link that named no node', () => {
    expect(
      frameUrlOf({
        design: {
          ...DESIGN,
          url: 'https://www.figma.com/design/AbC123/Shop',
          nodeId: null,
        },
        frame: '4:5',
      }),
    ).toBe('https://www.figma.com/design/AbC123/Shop?node-id=4-5');
  });
});
