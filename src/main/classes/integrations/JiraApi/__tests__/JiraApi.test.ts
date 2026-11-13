import type { JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JiraApi } from '@/main/classes/integrations/JiraApi';

const SITE = 'https://acme.atlassian.net';
const SIGNED = { site: SITE, email: 'ana@acme.test', token: 'jira_secret' };

type Route = { status: number; body?: unknown; bytes?: string } | 'offline';

/**
 * Um site do Jira que responde por caminho, e lembra o que lhe perguntaram, como, com
 * quais cabeçalhos e o que foi mandado.
 */
function fakeSite(routes: Record<string, Route>) {
  const asked: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: string | FormData | undefined;
  }[] = [];
  const fetcher: JiraFetcher = (url, init) => {
    asked.push({
      url,
      method: init.method ?? 'GET',
      headers: init.headers,
      body: init.body,
    });

    const route = routes[url.replace(SITE, '')];

    if (route === 'offline') return Promise.reject(new Error('ENOTFOUND'));

    const answer = route ?? { status: 404, body: { errorMessages: ['Not here'] } };

    return Promise.resolve({
      ok: answer.status >= 200 && answer.status < 300,
      status: answer.status,
      json: () => Promise.resolve(answer.body),
      arrayBuffer: () =>
        Promise.resolve(new TextEncoder().encode(answer.bytes ?? '').buffer),
    });
  };

  return { fetcher, asked };
}

const api = (routes: Record<string, Route>, isConnected = true) => {
  const site = fakeSite(routes);

  return {
    ...site,
    jira: new JiraApi({
      credentials: () => Promise.resolve(isConnected ? SIGNED : null),
      fetcher: site.fetcher,
    }),
  };
};

const PICKER = {
  status: 200,
  body: {
    sections: [
      { id: 'hs', issues: [{ key: 'SHOP-14', summaryText: 'Frete grátis' }] },
      { id: 'cs', issues: [{ key: 'SHOP-12', summaryText: 'Aplicar cupom' }] },
    ],
  },
};

describe('JiraApi', () => {
  describe('search', () => {
    it('lists the issues the picker suggests, signed in as the QA', async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/picker?query=cupom&showSubTasks=true': PICKER,
      });

      expect(await jira.search(' cupom ')).toEqual({
        isListed: true,
        issues: [
          { key: 'SHOP-14', summary: 'Frete grátis', url: `${SITE}/browse/SHOP-14` },
          { key: 'SHOP-12', summary: 'Aplicar cupom', url: `${SITE}/browse/SHOP-12` },
        ],
      });
      expect(asked[0]?.headers.Authorization).toBe(
        `Basic ${Buffer.from('ana@acme.test:jira_secret').toString('base64')}`,
      );
    });

    /**
     * O seletor casa palavras; uma chave digitada inteira precisa vir primeiro mesmo
     * quando ele a acha depois.
     */
    it('puts the issue a typed key names first, once', async () => {
      const { jira } = api({
        '/rest/api/3/issue/SHOP-12?fields=summary': {
          status: 200,
          body: { key: 'SHOP-12', fields: { summary: 'Aplicar cupom' } },
        },
        '/rest/api/3/issue/picker?query=shop-12&showSubTasks=true': PICKER,
      });
      const found = await jira.search('shop-12');

      expect(found.isListed ? found.issues.map(({ key }) => key) : []).toEqual([
        'SHOP-12',
        'SHOP-14',
      ]);
    });

    it('says Jira is not connected, refused the token or was out of reach', async () => {
      expect(await api({}, false).jira.search('x')).toEqual({
        isListed: false,
        failure: 'not-connected',
      });
      expect(
        await api({
          '/rest/api/3/issue/picker?query=x&showSubTasks=true': { status: 401 },
        }).jira.search('x'),
      ).toEqual({ isListed: false, failure: 'unauthorized' });
      expect(
        await api({
          '/rest/api/3/issue/picker?query=x&showSubTasks=true': 'offline',
        }).jira.search('x'),
      ).toEqual({ isListed: false, failure: 'unreachable' });
    });
  });

  describe('story', () => {
    it('reads an issue with every field and their names', async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/SHOP-12?fields=*all&expand=names': {
          status: 200,
          body: { key: 'SHOP-12', fields: { summary: 'Aplicar cupom' }, names: {} },
        },
      });
      const read = await jira.story('SHOP-12');

      expect(read.isRead ? read.story.summary : null).toBe('Aplicar cupom');
      expect(asked[0]?.url).toBe(
        `${SITE}/rest/api/3/issue/SHOP-12?fields=*all&expand=names`,
      );
    });

    it('says when the issue is not there', async () => {
      expect(await api({}).jira.story('SHOP-99')).toEqual({
        isRead: false,
        failure: 'not-found',
      });
    });
  });

  describe('download', () => {
    it('writes an attached file to disk', async () => {
      const file = join(await mkdtemp(join(tmpdir(), 'qazinho-jira-file-')), 'tela.png');
      const { jira } = api({
        '/rest/api/3/attachment/content/10001': { status: 200, bytes: 'png' },
      });

      expect(await jira.download({ id: '10001', file, maxBytes: 100 })).toBe(true);
      expect(await readFile(file, 'utf8')).toBe('png');
    });

    it('does NOT write a file Jira refused, or one larger than allowed', async () => {
      const file = join(await mkdtemp(join(tmpdir(), 'qazinho-jira-file-')), 'big.png');
      const { jira } = api({
        '/rest/api/3/attachment/content/2': { status: 200, bytes: 'too big' },
      });

      expect(await jira.download({ id: '1', file, maxBytes: 100 })).toBe(false);
      expect(await jira.download({ id: '2', file, maxBytes: 3 })).toBe(false);
      await expect(readFile(file)).rejects.toThrow();
    });
  });

  describe('projects', () => {
    it('lists the projects the QA opened last first, each once', async () => {
      const { jira } = api({
        '/rest/api/3/project/recent': {
          status: 200,
          body: [{ key: 'OPS', name: 'Operações' }],
        },
        '/rest/api/3/project/search?maxResults=100': {
          status: 200,
          body: {
            values: [
              { key: 'SHOP', name: 'Loja' },
              { key: 'OPS', name: 'Operações' },
            ],
          },
        },
      });

      expect(await jira.projects()).toEqual({
        isListed: true,
        projects: [
          { key: 'OPS', name: 'Operações' },
          { key: 'SHOP', name: 'Loja' },
        ],
      });
    });

    it('lists them even when Jira keeps no recent ones, and says when it lists none', async () => {
      const { jira } = api({
        '/rest/api/3/project/search?maxResults=100': {
          status: 200,
          body: { values: [{ key: 'SHOP', name: 'Loja' }] },
        },
      });

      expect(await jira.projects()).toEqual({
        isListed: true,
        projects: [{ key: 'SHOP', name: 'Loja' }],
      });
      expect(
        await api({
          '/rest/api/3/project/search?maxResults=100': { status: 401 },
        }).jira.projects(),
      ).toEqual({ isListed: false, failure: 'unauthorized' });
    });
  });

  describe('fileBug', () => {
    const REPORT = {
      title: 'Coupon\nrefused',
      blocks: [{ kind: 'paragraph' as const, text: 'SAVE10 is refused.' }],
    };
    const TYPES = {
      status: 200,
      body: {
        issueTypes: [
          { id: '10001', name: 'Story', subtask: false },
          { id: '10004', name: 'Bug', subtask: false },
        ],
      },
    };

    it("files the bug as the project's Bug type, its title on one line and its report as a document", async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/createmeta/SHOP/issuetypes': TYPES,
        '/rest/api/3/issue': { status: 201, body: { id: '20057', key: 'SHOP-57' } },
      });

      expect(await jira.fileBug({ project: 'SHOP', report: REPORT })).toEqual({
        isFiled: true,
        key: 'SHOP-57',
        url: `${SITE}/browse/SHOP-57`,
      });

      const sent = asked.find(({ method }) => method === 'POST');

      expect(sent?.headers['Content-Type']).toBe('application/json');
      expect(JSON.parse(typeof sent?.body === 'string' ? sent.body : 'null')).toEqual({
        fields: {
          project: { key: 'SHOP' },
          issuetype: { id: '10004' },
          summary: 'Coupon refused',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'SAVE10 is refused.' }],
              },
            ],
          },
        },
      });
    });

    it("says in Jira's words why it refused the issue", async () => {
      const { jira } = api({
        '/rest/api/3/issue/createmeta/SHOP/issuetypes': TYPES,
        '/rest/api/3/issue': {
          status: 400,
          body: { errorMessages: [], errors: { components: 'Component/s is required.' } },
        },
      });

      expect(await jira.fileBug({ project: 'SHOP', report: REPORT })).toEqual({
        isFiled: false,
        failure: 'rejected',
        said: 'Component/s is required.',
      });
    });

    it('does NOT file in a project Jira does not have', async () => {
      const { jira, asked } = api({});

      expect(await jira.fileBug({ project: 'NOPE', report: REPORT })).toMatchObject({
        isFiled: false,
        failure: 'not-found',
      });
      expect(asked.some(({ method }) => method === 'POST')).toBe(false);
    });
  });

  describe('attach and relate', () => {
    it('attaches a file with the header Jira asks for', async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/SHOP-57/attachments': {
          status: 200,
          body: [{ filename: 'tela.png' }],
        },
      });

      expect(
        await jira.attach({
          key: 'SHOP-57',
          name: 'tela.png',
          type: 'image/png',
          bytes: new Uint8Array([1, 2, 3]),
        }),
      ).toBe(true);
      expect(asked[0]?.headers['X-Atlassian-Token']).toBe('no-check');

      const form = asked[0]?.body;
      const file = form instanceof FormData ? form.get('file') : null;

      expect(file instanceof File ? [file.name, file.type, file.size] : null).toEqual([
        'tela.png',
        'image/png',
        3,
      ]);
    });

    it('relates a bug to its story, and says when Jira refused it', async () => {
      const { jira, asked } = api({ '/rest/api/3/issueLink': { status: 201 } });

      expect(await jira.relate({ key: 'SHOP-57', to: 'SHOP-12' })).toBe(true);
      expect(
        JSON.parse(typeof asked[0]?.body === 'string' ? asked[0].body : 'null'),
      ).toEqual({
        type: { name: 'Relates' },
        inwardIssue: { key: 'SHOP-57' },
        outwardIssue: { key: 'SHOP-12' },
      });
      expect(await api({}).jira.relate({ key: 'SHOP-57', to: 'SHOP-12' })).toBe(false);
    });
  });

  describe('issue and comment', () => {
    it('reads the issue with its status and comments, the way a review needs it', async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/SHOP-57?fields=summary,description,status,comment': {
          status: 200,
          body: {
            key: 'SHOP-57',
            fields: {
              summary: 'Coupon',
              status: { name: 'Done', statusCategory: { key: 'done' } },
            },
          },
        },
      });

      expect(await jira.issue('SHOP-57')).toMatchObject({
        isRead: true,
        issue: { key: 'SHOP-57', isClosed: true },
      });
      expect(asked[0]?.method).toBe('GET');
      expect(await api({}).jira.issue('SHOP-99')).toMatchObject({
        isRead: false,
        failure: 'not-found',
      });
    });

    it('comments under the issue and points at the comment', async () => {
      const { jira, asked } = api({
        '/rest/api/3/issue/SHOP-57/comment': { status: 201, body: { id: '10100' } },
      });

      expect(
        await jira.comment({
          key: 'SHOP-57',
          report: { title: '', blocks: [{ kind: 'paragraph', text: 'Seen again.' }] },
        }),
      ).toEqual({
        isPosted: true,
        url: `${SITE}/browse/SHOP-57?focusedCommentId=10100`,
        missed: [],
      });
      expect(
        JSON.parse(typeof asked[0]?.body === 'string' ? asked[0].body : 'null'),
      ).toEqual({
        body: {
          type: 'doc',
          version: 1,
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Seen again.' }] },
          ],
        },
      });
    });
  });

  /**
   * As dúvidas que ninguém aqui sabe vão à história num comentário do QA, que menciona quem
   * a escreveu e o põe para acompanhá-la; as respostas voltam pelos comentários seguintes.
   */
  describe('the doubts on a story', () => {
    const STORY = '/rest/api/3/issue/SHOP-878';
    const ME = { accountId: 'qa-1', displayName: 'Ana QA' };
    const REPORTER = { accountId: 'po-7', displayName: 'Rui PO' };
    const POST = {
      key: 'SHOP-878',
      intro: 'two doubts before we test this:',
      doubts: [
        { id: 'D1', question: 'Does a coupon stack with free shipping?' },
        { id: 'D2', question: 'Which error shows for an expired coupon?' },
      ],
      closing: 'Answer naming the doubt, like D1.',
      isWatching: true,
    };

    it('says who wrote the story and whether the QA already follows it', async () => {
      const { jira } = api({
        [`${STORY}?fields=reporter,watches`]: {
          status: 200,
          body: { fields: { reporter: REPORTER, watches: { isWatching: true } } },
        },
      });

      expect(await jira.people('SHOP-878')).toEqual({
        isRead: true,
        reporter: 'Rui PO',
        isWatching: true,
      });
      expect(await api({}, false).jira.people('SHOP-878')).toEqual({
        isRead: false,
        failure: 'not-connected',
      });
    });

    it('posts the doubts mentioning who wrote the story, and follows it', async () => {
      const { jira, asked } = api({
        [`${STORY}?fields=reporter`]: {
          status: 200,
          body: { fields: { reporter: REPORTER } },
        },
        '/rest/api/3/myself': { status: 200, body: ME },
        [`${STORY}/comment`]: {
          status: 201,
          body: { id: '10200', created: '2026-11-13T10:00:00.000-0300' },
        },
        [`${STORY}/watchers`]: { status: 204 },
      });

      expect(await jira.askStory(POST)).toEqual({
        isPosted: true,
        url: `${SITE}/browse/SHOP-878?focusedCommentId=10200`,
        at: '2026-11-13T13:00:00.000Z',
        mentioned: 'Rui PO',
      });

      const comment = asked.find(({ url }) => url.endsWith('/comment'));
      const watch = asked.find(({ url }) => url.endsWith('/watchers'));

      expect(JSON.stringify(comment?.body)).toContain('po-7');
      expect(comment?.method).toBe('POST');
      expect(watch).toMatchObject({ method: 'POST', body: '"qa-1"' });
    });

    it('does NOT mention the QA who wrote the story, nor follow it when not asked', async () => {
      const { jira, asked } = api({
        [`${STORY}?fields=reporter`]: { status: 200, body: { fields: { reporter: ME } } },
        '/rest/api/3/myself': { status: 200, body: ME },
        [`${STORY}/comment`]: { status: 201, body: { id: '10201' } },
      });

      expect(await jira.askStory({ ...POST, isWatching: false })).toMatchObject({
        isPosted: true,
        mentioned: null,
      });
      expect(
        JSON.stringify(asked.find(({ url }) => url.endsWith('/comment'))?.body),
      ).not.toContain('mention');
      expect(asked.some(({ url }) => url.endsWith('/watchers'))).toBe(false);
    });

    it('says why the comment was refused, in the words of Jira', async () => {
      const { jira } = api({
        [`${STORY}/comment`]: {
          status: 400,
          body: { errorMessages: ['Comments are closed on this issue.'] },
        },
      });

      expect(await jira.askStory(POST)).toEqual({
        isPosted: false,
        failure: 'rejected',
        said: 'Comments are closed on this issue.',
      });
    });

    it('reads the answers the team left after the QA asked', async () => {
      const doc = (text: string) => ({
        type: 'doc',
        version: 1,
        content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
      });
      const { jira } = api({
        [`${STORY}/comment?orderBy=-created&maxResults=100`]: {
          status: 200,
          body: {
            comments: [
              {
                id: '10210',
                author: REPORTER,
                created: '2026-11-13T15:00:00.000Z',
                body: doc('D2: "This coupon expired".'),
              },
              {
                id: '10200',
                author: ME,
                created: '2026-11-13T13:00:00.000Z',
                body: doc('D1 Does a coupon stack? D2 Which error?'),
              },
            ],
          },
        },
        '/rest/api/3/myself': { status: 200, body: ME },
      });
      const sent = {
        url: `${SITE}/browse/SHOP-878?focusedCommentId=10200`,
        at: '2026-11-13T13:00:00.000Z',
      };

      expect(
        await jira.answers({
          key: 'SHOP-878',
          doubts: [
            { id: 'D1', sent },
            { id: 'D2', sent },
          ],
        }),
      ).toEqual({
        isRead: true,
        answers: [
          {
            doubtId: 'D2',
            text: '"This coupon expired".',
            by: 'Rui PO',
            at: '2026-11-13T15:00:00.000Z',
          },
        ],
      });
    });
  });

  describe('boards, their columns and a story status', () => {
    it('lists the boards of the QA, filtered by the name typed', async () => {
      const { jira } = api({
        '/rest/agile/1.0/board?maxResults=50&name=Shop': {
          status: 200,
          body: { values: [{ id: 7, name: 'Shop', location: { projectKey: 'SHOP' } }] },
        },
      });

      expect(await jira.boards(' Shop ')).toEqual({
        isListed: true,
        boards: [{ id: 7, name: 'Shop', project: 'SHOP' }],
      });
      expect(await api({}, false).jira.boards('')).toEqual({
        isListed: false,
        failure: 'not-connected',
      });
    });

    it('reads the columns of a board, each with the statuses that fall in it', async () => {
      const { jira } = api({
        '/rest/agile/1.0/board/7/configuration': {
          status: 200,
          body: {
            columnConfig: {
              columns: [
                { name: 'To do', statuses: [{ id: '1' }] },
                { name: 'Ready for QA', statuses: [{ id: '10' }, { id: '11' }] },
              ],
            },
          },
        },
        '/rest/api/3/status': {
          status: 200,
          body: [
            { id: '1', name: 'To Do' },
            { id: '10', name: 'Ready for QA' },
            { id: '11', name: 'In QA' },
          ],
        },
      });

      expect(await jira.columns(7)).toEqual({
        isListed: true,
        columns: [
          { name: 'To do', statuses: ['To Do'] },
          { name: 'Ready for QA', statuses: ['Ready for QA', 'In QA'] },
        ],
      });
      expect(await jira.columns(8)).toEqual({ isListed: false, failure: 'not-found' });
    });

    it('reads the status a story is in now', async () => {
      const { jira } = api({
        '/rest/api/3/issue/SHOP-878?fields=status': {
          status: 200,
          body: { fields: { status: { name: 'Ready for QA' } } },
        },
      });

      expect(await jira.status('SHOP-878')).toEqual({
        isRead: true,
        status: 'Ready for QA',
      });
      expect(await jira.status('SHOP-1')).toEqual({
        isRead: false,
        failure: 'not-found',
      });
    });
  });
});
