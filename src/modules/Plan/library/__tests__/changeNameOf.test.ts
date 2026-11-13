import { describe, expect, it } from 'vitest';
import { changeNameOf } from '@/modules/Plan/library';

describe('changeNameOf', () => {
  it('names each source the way the QA knows it', () => {
    expect(
      [
        {
          kind: 'story' as const,
          key: 'SHOP-878',
          url: '',
          at: '',
          before: '',
          after: '',
          comments: [],
        },
        {
          kind: 'page' as const,
          title: 'Regras',
          url: '',
          at: '',
          before: '',
          after: '',
        },
        {
          kind: 'code' as const,
          repository: 'shop/web',
          branch: 'feat/coupon',
          from: 'a',
          to: 'b',
          files: [],
        },
        { kind: 'meeting' as const, name: 'alinhamento.vtt', at: '', text: '' },
      ].map(changeNameOf),
    ).toEqual(['SHOP-878', 'Regras', 'feat/coupon', 'alinhamento.vtt']);
  });
});
