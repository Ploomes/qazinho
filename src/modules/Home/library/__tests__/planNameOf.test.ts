import { describe, expect, it } from 'vitest';
import { planNameOf } from '@/modules/Home/library';

describe('planNameOf', () => {
  it('names the plan by the first line the QA wrote, capitalized, without the full stop', () => {
    expect(planNameOf('  o cupom de desconto no checkout.\nfoca no total')).toBe(
      'O cupom de desconto no checkout',
    );
  });

  it('cuts a long ask at a word, and says it was cut', () => {
    const named = planNameOf(
      'o checkout inteiro com cupom, frete, troca de endereço e pagamento com dois cartões',
    );

    expect(named.length).toBeLessThanOrEqual(61);
    expect(named.endsWith('…')).toBe(true);
    expect(named.startsWith('O checkout inteiro com cupom')).toBe(true);
  });

  it('gives nothing for an empty ask', () => {
    expect(planNameOf('   ')).toBe('');
  });
});
