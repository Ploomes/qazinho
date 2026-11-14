import {
  EXAMPLE_PRODUCTS,
  EXAMPLE_SHOP_PAGE,
} from '@/main/classes/projects/ExampleShop/constants';

/**
 * O que a loja de exemplo responde a um caminho: a página, a busca de produtos, que
 * quebra de propósito com uma busca vazia, ou nada.
 */
export function shopAnswerOf(props: { path: string; query: URLSearchParams }): {
  status: number;
  type: string;
  body: string;
} {
  if (props.path === '/' || props.path === '/index.html')
    return { status: 200, type: 'text/html; charset=utf-8', body: EXAMPLE_SHOP_PAGE };

  if (props.path !== '/api/products')
    return { status: 404, type: 'text/plain; charset=utf-8', body: 'Not found' };

  const typed = (props.query.get('q') ?? '').trim().toLowerCase();

  if (typed === '')
    return json({ status: 500, body: { error: 'The search index is not ready' } });

  return json({
    status: 200,
    body: {
      products: EXAMPLE_PRODUCTS.filter(
        (product) =>
          typed === '*' ||
          product.pt.toLowerCase().includes(typed) ||
          product.en.toLowerCase().includes(typed),
      ),
    },
  });
}

function json(props: { status: number; body: unknown }) {
  return {
    status: props.status,
    type: 'application/json; charset=utf-8',
    body: JSON.stringify(props.body),
  };
}
