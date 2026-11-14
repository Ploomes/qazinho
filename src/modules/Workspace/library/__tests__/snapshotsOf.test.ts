import { describe, expect, it } from 'vitest';
import { snapshotsOf } from '@/modules/Workspace/library';

const STORY = {
  kind: 'story',
  key: 'SHOP-878',
  url: 'https://shop.atlassian.net/browse/SHOP-878',
  text: 'C3. Bloquear depois de 3 tentativas',
  at: '2026-11-13T13:00:00.000Z',
};
const PAGE = {
  kind: 'page',
  pageId: '42',
  title: 'Regras do cupom',
  url: 'https://shop.atlassian.net/wiki/x',
  text: 'Um cupom por pedido.',
  at: '2026-11-13T13:00:00.000Z',
};

describe('snapshotsOf', () => {
  it('reads back how the story and the page of a plan read when it was written', () => {
    expect(snapshotsOf([STORY, PAGE])).toEqual([STORY, PAGE]);
  });

  it('leaves out what someone broke by hand, and reads nothing from what is not a list', () => {
    expect(snapshotsOf([{ ...STORY, text: 7 }, { ...PAGE, kind: 'code' }, null])).toEqual(
      [],
    );
    expect(snapshotsOf('nope')).toEqual([]);
  });
});
