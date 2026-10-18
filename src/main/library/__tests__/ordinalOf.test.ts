import { describe, expect, it } from 'vitest';
import { ordinalOf } from '@/main/library';

describe('ordinalOf', () => {
  it('reads a number after the name as which of several', () => {
    expect(ordinalOf('Comprar #2')).toEqual({ name: 'Comprar', nth: 1 });
  });

  it('takes a name with no number as the first', () => {
    expect(ordinalOf('  Aplicar cupom ')).toEqual({ name: 'Aplicar cupom', nth: 0 });
  });

  it('leaves a # that is part of the name alone', () => {
    expect(ordinalOf('#submit')).toEqual({ name: '#submit', nth: 0 });
    expect(ordinalOf('Pedido #1042 detalhes')).toEqual({
      name: 'Pedido #1042 detalhes',
      nth: 0,
    });
  });

  it('reads #0 as the first, never as before it', () => {
    expect(ordinalOf('Comprar #0')).toEqual({ name: 'Comprar', nth: 0 });
  });
});
