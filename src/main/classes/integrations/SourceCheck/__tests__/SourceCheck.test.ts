import type { ISourceCheck } from '@/main/classes/integrations/SourceCheck/types';
import type { IJiraStory, ISourceSnapshot } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { SourceCheck } from '@/main/classes/integrations/SourceCheck';

const STORY: IJiraStory = {
  key: 'SHOP-878',
  url: 'https://shop.atlassian.net/browse/SHOP-878',
  summary: 'Cupom',
  type: 'Story',
  status: 'In Progress',
  priority: '',
  labels: [],
  components: [],
  parent: '',
  description: 'C3. Bloquear depois de 3 tentativas',
  acceptance: [],
  comments: [],
  links: [],
  subtasks: [],
  attachments: [],
};

const SNAP: ISourceSnapshot = {
  kind: 'story',
  key: 'SHOP-878',
  url: STORY.url,
  text: 'C3. Bloquear depois de 3 tentativas',
  at: '2026-11-13T13:00:00.000Z',
};

const PAGE: ISourceSnapshot = {
  kind: 'page',
  pageId: '42',
  title: 'Regras',
  url: 'https://shop.atlassian.net/wiki/42',
  text: 'Um cupom por pedido.',
  at: '2026-11-13T13:00:00.000Z',
};

const CODE = {
  repository: 'shop/web',
  branch: 'feat/coupon',
  base: 'main',
  commit: 'aaa',
};

/** Um Jira, um Confluence e um gh que respondem o que o teste mandar. */
function check(over: Partial<ISourceCheck> = {}) {
  return new SourceCheck({
    readStory: () => Promise.resolve({ isRead: true, story: STORY }),
    readComments: () => Promise.resolve([]),
    readPage: () =>
      Promise.resolve({
        isRead: true,
        page: { id: '42', title: 'Regras', space: 'SHOP', url: PAGE.url },
        text: 'Um cupom por pedido.',
      }),
    githubApi: (path) =>
      Promise.resolve(
        path.includes('/branches/')
          ? { isOk: true, text: JSON.stringify({ commit: { sha: 'aaa' } }) }
          : { isOk: true, text: JSON.stringify({ files: [] }) },
      ),
    storyTextOf: (story) => story.description,
    ...over,
  });
}

describe('SourceCheck', () => {
  it('finds nothing when the story, the page and the branch read as before', async () => {
    expect(
      await check().check({ snapshots: [SNAP, PAGE], code: CODE, posted: [] }),
    ).toEqual({
      changes: [],
      snapshots: [SNAP, PAGE],
      code: CODE,
      missed: [],
    });
  });

  it('finds a story whose words changed, with the new comments, and how it reads now', async () => {
    const checked = await check({
      readStory: () =>
        Promise.resolve({
          isRead: true,
          story: { ...STORY, description: 'C3. Bloquear depois de 5 tentativas' },
        }),
      readComments: () =>
        Promise.resolve([
          { author: 'Rui PO', at: '2026-11-13T15:00:00.000Z', text: 'Agora 5.' },
        ]),
    }).check({ snapshots: [SNAP], code: null, posted: [] });

    expect(checked.changes).toEqual([
      expect.objectContaining({
        kind: 'story',
        key: 'SHOP-878',
        before: 'C3. Bloquear depois de 3 tentativas',
        after: 'C3. Bloquear depois de 5 tentativas',
        comments: [
          { author: 'Rui PO', at: '2026-11-13T15:00:00.000Z', text: 'Agora 5.' },
        ],
      }),
    ]);
    expect(checked.snapshots[0]).toMatchObject({
      text: 'C3. Bloquear depois de 5 tentativas',
    });
  });

  /** Um comentário novo conta: pode responder uma dúvida ou mudar uma regra. */
  it('finds a story whose words held but that got a new comment', async () => {
    const checked = await check({
      readComments: () =>
        Promise.resolve([
          { author: 'Rui PO', at: '2026-11-13T15:00:00.000Z', text: 'D1: 10 min.' },
        ]),
    }).check({ snapshots: [SNAP], code: null, posted: [] });

    expect(checked.changes.map(({ kind }) => kind)).toEqual(['story']);
  });

  it('finds a page whose text changed', async () => {
    const checked = await check({
      readPage: () =>
        Promise.resolve({
          isRead: true,
          page: { id: '42', title: 'Regras', space: 'SHOP', url: PAGE.url },
          text: 'Dois cupons por pedido.',
        }),
    }).check({ snapshots: [PAGE], code: null, posted: [] });

    expect(checked.changes).toEqual([
      expect.objectContaining({
        kind: 'page',
        before: 'Um cupom por pedido.',
        after: 'Dois cupons por pedido.',
      }),
    ]);
  });

  it('finds a branch that moved, with the files it changed, and the commit it is at now', async () => {
    const checked = await check({
      githubApi: (path) =>
        Promise.resolve(
          path.includes('/branches/')
            ? { isOk: true, text: JSON.stringify({ commit: { sha: 'bbb' } }) }
            : {
                isOk: true,
                text: JSON.stringify({
                  files: [{ filename: 'src/coupon.ts', patch: '+5' }],
                }),
              },
        ),
    }).check({ snapshots: [], code: CODE, posted: [] });

    expect(checked.changes).toEqual([
      {
        kind: 'code',
        repository: 'shop/web',
        branch: 'feat/coupon',
        from: 'aaa',
        to: 'bbb',
        files: [{ path: 'src/coupon.ts', patch: '+5' }],
      },
    ]);
    expect(checked.code).toEqual({ ...CODE, commit: 'bbb' });
  });

  it('names the sources it could not read, and keeps them as they were', async () => {
    const checked = await check({
      readStory: () => Promise.resolve({ isRead: false, failure: 'unreachable' }),
      githubApi: () =>
        Promise.resolve({ isOk: false, failure: 'no-cli', httpStatus: null, said: '' }),
    }).check({ snapshots: [SNAP], code: CODE, posted: [] });

    expect(checked).toEqual({
      changes: [],
      snapshots: [SNAP],
      code: CODE,
      missed: ['SHOP-878', 'feat/coupon'],
    });
  });
});
