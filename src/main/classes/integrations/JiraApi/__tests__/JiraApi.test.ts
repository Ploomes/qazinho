import type { JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { JiraApi } from '@/main/classes/integrations/JiraApi';

const SITE = 'https://acme.atlassian.net';
const SIGNED = { site: SITE, email: 'ana@acme.test', token: 'jira_secret' };

type Route = { status: number; body?: unknown; bytes?: string } | 'offline';

/** A Jira site that answers by path, and remembers what it was asked and with which headers. */
function fakeSite(routes: Record<string, Route>) {
  const asked: { url: string; headers: Record<string, string> }[] = [];
  const fetcher: JiraFetcher = (url, init) => {
    asked.push({ url, headers: init.headers });

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

    /** The picker matches words; a key typed whole must come first even when it finds it later. */
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
});
