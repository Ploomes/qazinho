import type { JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import { describe, expect, it } from 'vitest';
import { ConfluenceApi } from '@/main/classes/integrations/ConfluenceApi';

const SITE = 'https://acme.atlassian.net';
const SIGNED = { site: SITE, email: 'ana@acme.test', token: 'jira_secret' };
const DOC = {
  type: 'doc',
  version: 1,
  content: [
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'CT-01 Cupom' }],
    },
    { type: 'paragraph', content: [{ type: 'text', text: 'Aplicar SAVE10' }] },
  ],
};

type Route = { status: number; body?: unknown } | 'offline';

/** A Confluence site that answers by method and path, and remembers what it was sent. */
function fakeSite(routes: Record<string, Route>) {
  const asked: { method: string; path: string; body: unknown }[] = [];
  const fetcher: JiraFetcher = (url, init) => {
    const method = init.method ?? 'GET';
    const path = url.replace(SITE, '');

    asked.push({
      method,
      path,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    });

    const route = routes[`${method} ${path}`];

    if (route === 'offline') return Promise.reject(new Error('ENOTFOUND'));

    const answer = route ?? { status: 404, body: { message: 'Not here' } };

    return Promise.resolve({
      ok: answer.status >= 200 && answer.status < 300,
      status: answer.status,
      json: () => Promise.resolve(answer.body),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
  };

  return { fetcher, asked };
}

const api = (props: { fetcher: JiraFetcher; isOn?: boolean }) =>
  new ConfluenceApi({
    credentials: () => Promise.resolve(props.isOn === false ? null : SIGNED),
    jira: () => Promise.resolve(SIGNED),
    fetcher: props.fetcher,
  });

describe('ConfluenceApi', () => {
  describe('check', () => {
    it('says the Jira account reaches Confluence on the same site', async () => {
      const { fetcher } = fakeSite({
        'GET /wiki/api/v2/spaces?limit=1': { status: 200, body: { results: [] } },
      });

      expect(await api({ fetcher, isOn: false }).check()).toEqual({ isOk: true });
    });

    it('says why it does not, in the site’s words', async () => {
      const { fetcher } = fakeSite({
        'GET /wiki/api/v2/spaces?limit=1': {
          status: 403,
          body: { message: 'No Confluence' },
        },
      });

      expect(await api({ fetcher }).check()).toEqual({
        isOk: false,
        failure: 'unauthorized',
        said: 'No Confluence',
      });
    });
  });

  it('lists the spaces by name', async () => {
    const { fetcher } = fakeSite({
      'GET /wiki/api/v2/spaces?limit=100': {
        status: 200,
        body: {
          results: [
            { id: '2', key: 'QA', name: 'Qualidade' },
            { id: '1', key: 'ENG', name: 'Engenharia' },
          ],
        },
      },
    });

    expect(await api({ fetcher }).spaces()).toEqual({
      isListed: true,
      spaces: [
        { id: '1', key: 'ENG', name: 'Engenharia' },
        { id: '2', key: 'QA', name: 'Qualidade' },
      ],
    });
  });

  it('finds pages by their title, with their space and where they open', async () => {
    const site = fakeSite({
      [`GET /wiki/rest/api/search?${new URLSearchParams({ cql: 'type = page AND title ~ "Construtor*" ORDER BY lastmodified DESC', limit: '20' }).toString()}`]:
        {
          status: 200,
          body: {
            results: [
              {
                content: {
                  id: '288620570',
                  type: 'page',
                  title: 'Construtor IA',
                  _links: { webui: '/spaces/ENG/pages/288620570' },
                },
                resultGlobalContainer: { title: 'Engenharia' },
              },
            ],
          },
        },
    });

    expect(await api({ fetcher: site.fetcher }).search(' Construtor ')).toEqual({
      isListed: true,
      pages: [
        {
          id: '288620570',
          title: 'Construtor IA',
          space: 'Engenharia',
          url: `${SITE}/wiki/spaces/ENG/pages/288620570`,
        },
      ],
    });
  });

  it('does NOT reach Confluence while it is off', async () => {
    const { fetcher, asked } = fakeSite({});

    expect(await api({ fetcher, isOn: false }).search('x')).toEqual({
      isListed: false,
      failure: 'not-connected',
    });
    expect(asked).toEqual([]);
  });

  it('reads a page whole, its body as Markdown', async () => {
    const { fetcher } = fakeSite({
      'GET /wiki/api/v2/pages/42?body-format=atlas_doc_format': {
        status: 200,
        body: {
          id: '42',
          title: 'Casos do cupom',
          version: { number: 3 },
          spaceId: '1',
          body: { atlas_doc_format: { value: JSON.stringify(DOC) } },
          _links: { webui: '/spaces/QA/pages/42' },
        },
      },
    });

    const read = await api({ fetcher }).page('42');

    expect(read).toMatchObject({
      isRead: true,
      page: { id: '42', title: 'Casos do cupom', url: `${SITE}/wiki/spaces/QA/pages/42` },
    });
    expect(read.isRead && read.text).toContain('CT-01 Cupom');
    expect(read.isRead && read.text).toContain('Aplicar SAVE10');
  });

  describe('publish', () => {
    const PLAN = {
      pageId: null,
      spaceId: '1',
      parentId: '9',
      title: 'Cupom · casos de teste',
      blocks: [
        {
          kind: 'table' as const,
          head: ['#', 'Ação'],
          rows: [['1', 'Abrir o carrinho']],
        },
      ],
    };
    const MADE = {
      id: '77',
      title: 'Cupom · casos de teste',
      version: { number: 1 },
      spaceId: '1',
      _links: { webui: '/spaces/QA/pages/77' },
    };

    it('makes a new page under its parent, the plan as an Atlassian document', async () => {
      const { fetcher, asked } = fakeSite({
        'POST /wiki/api/v2/pages': { status: 200, body: MADE },
      });

      expect(await api({ fetcher }).publish(PLAN)).toEqual({
        isPublished: true,
        page: {
          id: '77',
          title: 'Cupom · casos de teste',
          space: '',
          url: `${SITE}/wiki/spaces/QA/pages/77`,
        },
      });

      const sent = asked[0]?.body as { body: { representation: string; value: string } };

      expect(asked[0]).toMatchObject({
        method: 'POST',
        body: {
          spaceId: '1',
          parentId: '9',
          status: 'current',
          title: 'Cupom · casos de teste',
        },
      });
      expect(sent.body.representation).toBe('atlas_doc_format');
      expect(JSON.parse(sent.body.value).content[0].type).toBe('table');
    });

    it('updates the page it published on before, as its next version', async () => {
      const { fetcher, asked } = fakeSite({
        'GET /wiki/api/v2/pages/77': {
          status: 200,
          body: { ...MADE, version: { number: 4 } },
        },
        'PUT /wiki/api/v2/pages/77': {
          status: 200,
          body: { ...MADE, version: { number: 5 } },
        },
      });

      expect(
        (await api({ fetcher }).publish({ ...PLAN, pageId: '77' })).isPublished,
      ).toBe(true);
      expect(asked[1]).toMatchObject({
        method: 'PUT',
        body: { id: '77', version: { number: 5, message: 'Updated from QAzinho' } },
      });
    });

    it('makes the page again when the one it published on is gone', async () => {
      const { fetcher, asked } = fakeSite({
        'POST /wiki/api/v2/pages': { status: 200, body: MADE },
      });

      expect(
        (await api({ fetcher }).publish({ ...PLAN, pageId: '66' })).isPublished,
      ).toBe(true);
      expect(asked.map(({ method }) => method)).toEqual(['GET', 'POST']);
    });

    it('says why Confluence refused it, in its words', async () => {
      const { fetcher } = fakeSite({
        'POST /wiki/api/v2/pages': {
          status: 400,
          body: { errors: [{ title: 'A page with this title already exists' }] },
        },
      });

      expect(await api({ fetcher }).publish(PLAN)).toMatchObject({
        isPublished: false,
        failure: 'rejected',
      });
    });
  });
});
