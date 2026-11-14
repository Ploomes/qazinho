import { describe, expect, it } from 'vitest';
import { lineDiffOf } from '@/modules/Plan/library';

describe('lineDiffOf', () => {
  it('says the line that left and the line that came in its place', () => {
    expect(
      lineDiffOf({
        before: '- O cupom PROMO10 tira 10%\n- Só um cupom vale por pedido',
        after: '- O cupom PROMO10 tira 10%\n- Um cupom novo substitui o anterior',
      }),
    ).toEqual({
      removed: ['- Só um cupom vale por pedido'],
      added: ['- Um cupom novo substitui o anterior'],
    });
  });

  it('keeps a moved line as it was, and only names what is new', () => {
    expect(lineDiffOf({ before: 'a\nb', after: 'a\nb\nc' })).toEqual({
      removed: [],
      added: ['c'],
    });
  });

  it('does NOT count spaces or blank lines as a change', () => {
    expect(lineDiffOf({ before: 'a  b\n\nc', after: 'a b\nc\n' })).toEqual({
      removed: [],
      added: [],
    });
  });
});
