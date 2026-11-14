import { describe, expect, it } from 'vitest';
import { planNameOf } from '@/modules/Home/library';

describe('planNameOf', () => {
  it('names the plan by the first line the QA wrote, capitalized, without the full stop', () => {
    expect(planNameOf('  o cupom de desconto no checkout.\nfoca no total')).toBe(
      'O cupom de desconto no checkout',
    );
  });

  /** O "…" ficava dentro do nome, e o QA não passava dele ao editar. */
  it('cuts a long ask at a word, with no dots in the name', () => {
    const named = planNameOf(
      'o checkout inteiro com cupom, frete, troca de endereço e pagamento com dois cartões',
    );

    expect(named.length).toBeLessThanOrEqual(60);
    expect(named).not.toMatch(/[…,]$/);
    expect(named.startsWith('O checkout inteiro com cupom, frete')).toBe(true);
  });

  it('names a long ask by what comes before its colon', () => {
    expect(
      planNameOf(
        'O carrinho: adicionar e remover itens, o contador no topo, o cupom PROMO10, o frete',
      ),
    ).toBe('O carrinho');
  });

  it('keeps a short line whole, colon included', () => {
    expect(planNameOf('Checkout: pagar com Pix')).toBe('Checkout: pagar com Pix');
  });

  it('gives nothing for an empty ask', () => {
    expect(planNameOf('   ')).toBe('');
  });
});
