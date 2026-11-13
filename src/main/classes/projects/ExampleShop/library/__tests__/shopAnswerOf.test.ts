import { describe, expect, it } from 'vitest';
import { shopAnswerOf } from '@/main/classes/projects/ExampleShop/library';

const ask = (path: string, query = '') =>
  shopAnswerOf({ path, query: new URLSearchParams(query) });

describe('shopAnswerOf', () => {
  it('serves the page at the root', () => {
    expect(ask('/')).toMatchObject({ status: 200, type: 'text/html; charset=utf-8' });
    expect(ask('/').body).toContain('data-testid="cart-total"');
  });

  it('finds products by their name in either language, and lists all with *', () => {
    const names = (query: string) =>
      (
        JSON.parse(ask('/api/products', query).body) as { products: { id: string }[] }
      ).products.map(({ id }) => id);

    expect(names('q=mochila')).toEqual(['backpack']);
    expect(names('q=Running')).toEqual(['runner']);
    expect(names('q=*')).toHaveLength(4);
  });

  /** O bug plantado que o agente deve achar: a busca vazia quebra o servidor. */
  it('breaks with a 500 on an empty search, on purpose', () => {
    expect(ask('/api/products', 'q=%20').status).toBe(500);
    expect(ask('/api/products').status).toBe(500);
  });

  it('answers nothing else', () => {
    expect(ask('/admin').status).toBe(404);
  });
});
