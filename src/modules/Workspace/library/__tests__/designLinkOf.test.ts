import { describe, expect, it } from 'vitest';
import { designLinkOf } from '@/modules/Workspace/library';

describe('designLinkOf', () => {
  it('reads the file, the frame and the name of a design link', () => {
    expect(
      designLinkOf(
        ' https://www.figma.com/design/AbC123xyz/Shop-%E2%80%94-Checkout?node-id=12-345&t=k9 ',
      ),
    ).toEqual({
      url: 'https://www.figma.com/design/AbC123xyz/Shop-%E2%80%94-Checkout?node-id=12-345&t=k9',
      fileKey: 'AbC123xyz',
      nodeId: '12:345',
      name: 'Shop — Checkout',
    });
  });

  it('reads the older file links, prototypes and a node id written with a colon', () => {
    expect(designLinkOf('https://figma.com/file/AbC123/Shop?node-id=1%3A2')?.nodeId).toBe(
      '1:2',
    );
    expect(
      designLinkOf('https://www.figma.com/proto/AbC123/Shop?node-id=4-5'),
    ).toMatchObject({ fileKey: 'AbC123', nodeId: '4:5' });
  });

  it('reads the branch a link opens, since that is the file Figma serves', () => {
    expect(
      designLinkOf('https://www.figma.com/design/AbC123/branch/Br4nch/Shop?node-id=1-2')
        ?.fileKey,
    ).toBe('Br4nch');
  });

  it('keeps a link to the whole file, with no node, named by its key when it has no name', () => {
    expect(designLinkOf('https://www.figma.com/design/AbC123')).toMatchObject({
      fileKey: 'AbC123',
      nodeId: null,
      name: 'AbC123',
    });
  });

  it('does NOT take a FigJam board, another site, plain http or words', () => {
    expect(designLinkOf('https://www.figma.com/board/AbC123/Flow')).toBeNull();
    expect(designLinkOf('https://www.figma.com.evil.test/design/AbC123/Shop')).toBeNull();
    expect(designLinkOf('http://www.figma.com/design/AbC123/Shop')).toBeNull();
    expect(designLinkOf('the checkout frame')).toBeNull();
  });
});
