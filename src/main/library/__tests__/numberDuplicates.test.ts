import { describe, expect, it } from 'vitest';
import { numberDuplicates } from '@/main/library';

describe('numberDuplicates', () => {
  it('numbers the controls that read alike, in page order', () => {
    expect(
      numberDuplicates([
        'a: Início',
        'button: Comprar',
        'button: Comprar',
        'button: Comprar',
      ]),
    ).toEqual([
      'a: Início',
      'button: Comprar #1',
      'button: Comprar #2',
      'button: Comprar #3',
    ]);
  });

  it('leaves a control that reads like no other as it is', () => {
    expect(numberDuplicates(['button: Buscar', 'a: Produtos'])).toEqual([
      'button: Buscar',
      'a: Produtos',
    ]);
  });

  it('keeps a link and a button of the same words apart', () => {
    expect(numberDuplicates(['a: Entrar', 'button: Entrar'])).toEqual([
      'a: Entrar',
      'button: Entrar',
    ]);
  });
});
