import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';
import { JIRA_EMAIL, JIRA_TOKEN } from './fakeJira';

type Page = {
  id: string;
  title: string;
  spaceId: string;
  parentId: string | null;
  version: number;
  adf: unknown;
};

const cell = (kind: 'tableHeader' | 'tableCell', text: string) => ({
  type: kind,
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});

/** Os casos que um time escreveu no Confluence, como um título e uma tabela de passos. */
const CASES = {
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'CT01 · Cupom válido' }],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [cell('tableHeader', 'Ação'), cell('tableHeader', 'Esperado')],
        },
        {
          type: 'tableRow',
          content: [cell('tableCell', 'Aplicar SAVE10'), cell('tableCell', '10% off')],
        },
      ],
    },
  ],
};

/**
 * Um site do Confluence Cloud em loopback, logado com a mesma conta do Jira fake:
 * espaços, uma busca, páginas lidas, feitas e versionadas.
 */
export function fakeConfluence() {
  const basic = `Basic ${Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString('base64')}`;
  const asked: string[] = [];
  const pages = new Map<string, Page>([
    [
      '98304',
      {
        id: '98304',
        title: 'Checkout: cenários',
        spaceId: '9',
        parentId: null,
        version: 3,
        adf: CASES,
      },
    ],
  ]);
  let nextId = 200;

  const body = (request: IncomingMessage) =>
    new Promise<string>((done) => {
      const chunks: Buffer[] = [];

      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', () => {
        done(Buffer.concat(chunks).toString('utf8'));
      });
    });

  const json = (response: ServerResponse, answer: { status: number; body: unknown }) => {
    response.writeHead(answer.status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(answer.body));
  };

  const pageOf = (page: Page) => ({
    id: page.id,
    title: page.title,
    spaceId: page.spaceId,
    parentId: page.parentId,
    version: { number: page.version },
    body: { atlas_doc_format: { value: JSON.stringify(page.adf) } },
    _links: { webui: `/spaces/QA/pages/${page.id}` },
  });

  const server = createServer((request, response) => {
    void (async () => {
      const url = new URL(request.url ?? '/', 'http://confluence.test');

      asked.push(`${request.method ?? 'GET'} ${url.pathname}${url.search}`);

      if (request.headers.authorization !== basic) {
        json(response, { status: 401, body: { message: 'Unauthorized' } });

        return;
      }

      if (url.pathname === '/wiki/api/v2/spaces') {
        json(response, {
          status: 200,
          body: {
            results: [
              { id: '9', key: 'QA', name: 'Quality' },
              { id: '10', key: 'ENG', name: 'Engineering' },
            ],
          },
        });

        return;
      }

      if (url.pathname === '/wiki/rest/api/search') {
        const cql = url.searchParams.get('cql') ?? '';
        const typed = /title ~ "([^"*]*)\*"/.exec(cql)?.[1]?.toLowerCase() ?? '';

        json(response, {
          status: 200,
          body: {
            results: [...pages.values()]
              .filter(({ title }) => title.toLowerCase().includes(typed))
              .map((page) => ({
                content: {
                  id: page.id,
                  type: 'page',
                  title: page.title,
                  _links: { webui: `/spaces/QA/pages/${page.id}` },
                },
                resultGlobalContainer: { title: 'Quality' },
              })),
          },
        });

        return;
      }

      if (url.pathname === '/wiki/api/v2/pages' && request.method === 'POST') {
        const sent = JSON.parse(await body(request)) as {
          spaceId: string;
          title: string;
          parentId?: string;
          body: { value: string };
        };

        if ([...pages.values()].some(({ title }) => title === sent.title)) {
          json(response, {
            status: 400,
            body: {
              errors: [{ title: 'A page with this title already exists in this space' }],
            },
          });

          return;
        }

        nextId += 1;

        const made: Page = {
          id: String(nextId),
          title: sent.title,
          spaceId: sent.spaceId,
          parentId: sent.parentId ?? null,
          version: 1,
          adf: JSON.parse(sent.body.value) as unknown,
        };

        pages.set(made.id, made);
        json(response, { status: 200, body: pageOf(made) });

        return;
      }

      const one = /^\/wiki\/api\/v2\/pages\/(\w+)$/.exec(url.pathname);
      const page = one?.[1] === undefined ? undefined : pages.get(one[1]);

      if (one !== null && page === undefined) {
        json(response, { status: 404, body: { errors: [{ title: 'Not Found' }] } });

        return;
      }

      if (page !== undefined && request.method === 'PUT') {
        const sent = JSON.parse(await body(request)) as {
          title: string;
          version: { number: number };
          body: { value: string };
        };

        if (sent.version.number !== page.version + 1) {
          json(response, {
            status: 409,
            body: { errors: [{ title: 'Version must be incremented' }] },
          });

          return;
        }

        const updated = {
          ...page,
          title: sent.title,
          version: sent.version.number,
          adf: JSON.parse(sent.body.value) as unknown,
        };

        pages.set(page.id, updated);
        json(response, { status: 200, body: pageOf(updated) });

        return;
      }

      if (page !== undefined) {
        json(response, { status: 200, body: pageOf(page) });

        return;
      }

      json(response, { status: 404, body: { message: 'No route' } });
    })();
  });

  return { server, asked, pages };
}
