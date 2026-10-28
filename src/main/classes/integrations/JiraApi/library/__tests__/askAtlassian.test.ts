import type { JiraFetcher } from '@/main/classes/integrations/JiraApi/types';
import { describe, expect, it } from 'vitest';
import { askAtlassian } from '@/main/classes/integrations/JiraApi/library';

const SIGNED = {
  site: 'https://acme.atlassian.net',
  email: 'ana@acme.test',
  token: 't0k',
};

/** Um site que responde todo pedido do mesmo jeito, e lembra o que lhe perguntaram. */
function answering(answer: { ok: boolean; status: number; body?: unknown } | 'offline') {
  const asked: { url: string; init: Parameters<JiraFetcher>[1] }[] = [];
  const fetcher: JiraFetcher = (url, init) => {
    asked.push({ url, init });

    return answer === 'offline'
      ? Promise.reject(new Error('ENOTFOUND'))
      : Promise.resolve({
          ok: answer.ok,
          status: answer.status,
          json: () => Promise.resolve(answer.body),
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        });
  };

  return { fetcher, asked };
}

describe('askAtlassian', () => {
  it('signs a request to the site with the email and token, and reads its JSON', async () => {
    const { fetcher, asked } = answering({ ok: true, status: 200, body: { id: '1' } });
    const answer = await askAtlassian({
      fetcher,
      signed: SIGNED,
      path: '/wiki/api/v2/pages/1',
      method: 'PUT',
      json: { title: 'x' },
    });

    expect(answer).toEqual({ isOk: true, body: { id: '1' }, bytes: null });
    expect(asked[0]?.url).toBe('https://acme.atlassian.net/wiki/api/v2/pages/1');
    expect(asked[0]?.init).toMatchObject({
      method: 'PUT',
      body: '{"title":"x"}',
      headers: {
        Authorization: `Basic ${Buffer.from('ana@acme.test:t0k').toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });
  });

  it('says why the site refused, or that it was out of reach', async () => {
    expect(
      await askAtlassian({
        fetcher: answering({ ok: false, status: 403, body: { message: 'No access' } })
          .fetcher,
        signed: SIGNED,
        path: '/x',
      }),
    ).toMatchObject({ isOk: false, failure: 'unauthorized' });
    expect(
      await askAtlassian({
        fetcher: answering('offline').fetcher,
        signed: SIGNED,
        path: '/x',
      }),
    ).toEqual({ isOk: false, failure: 'unreachable', said: '' });
  });
});
