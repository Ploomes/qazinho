import { describe, expect, it } from 'vitest';
import { performBugSend } from '@/modules/Assistant/library';
import { CHECKOUT, fakePort, PROJECT } from './fixtures';

const JIRA = {
  id: 'jira' as const,
  account: 'Ana QA',
  site: 'https://acme.atlassian.net',
  connectedAt: '2026-10-20T10:00:00Z',
};
const GITHUB = {
  id: 'github' as const,
  account: 'octoqa',
  site: null,
  connectedAt: '2026-10-20T10:00:00Z',
};

const send = (
  args: Partial<{ tracker: 'jira' | 'github'; project: string; repository: string }> = {},
) => ({
  name: 'send_bug' as const,
  args: { workspace: 'Checkout regression', bug: 'bug-01', ...args },
});

describe('performBugSend', () => {
  it('sends the bug where the QA named, once they confirm it on screen', async () => {
    const { port, did } = fakePort({ state: { integrations: [JIRA, GITHUB] } });
    const done = await performBugSend({
      id: 'c-1',
      call: send({ project: 'SHOP' }),
      port,
    });

    expect(did).toEqual(['confirm send_bug BUG-01 0 Jira · SHOP', 'send w1 BUG-01 SHOP']);
    expect(done).toEqual({
      text: 'Filed BUG-01 as SHOP-57 in Jira · SHOP: https://tracker.test/57',
      isError: false,
    });
  });

  it('sends it to the Jira project of the story the workspace works from', async () => {
    const { port, did } = fakePort({
      state: {
        integrations: [JIRA, GITHUB],
        workspaces: [
          {
            ...CHECKOUT,
            issue: {
              key: 'LOJA-12',
              title: 'Cupom',
              source: 'jira',
              url: 'https://acme.atlassian.net/browse/LOJA-12',
            },
          },
        ],
      },
    });

    await performBugSend({ id: 'c-1', call: send(), port });

    expect(did.at(-1)).toBe('send w1 BUG-01 LOJA');
  });

  it('sends it where the project’s last bug went, and tells GitHub’s screen is pasted by hand', async () => {
    const { port, did } = fakePort({
      state: {
        integrations: [JIRA, GITHUB],
        projects: [
          { ...PROJECT, issueTarget: { tracker: 'github', owner: 'acme', name: 'api' } },
        ],
      },
    });
    const done = await performBugSend({ id: 'c-1', call: send(), port });

    expect(did).toEqual([
      'confirm send_bug BUG-01 0 GitHub · acme/api',
      'send w1 BUG-01 acme/api',
    ]);
    expect(done.text).toContain('copies its screen for the QA to paste');
  });

  it('does NOT send a bug the QA kept, and says so', async () => {
    const { port, did } = fakePort({
      state: { integrations: [JIRA] },
      decision: 'kept',
    });

    expect(
      await performBugSend({ id: 'c-1', call: send({ project: 'SHOP' }), port }),
    ).toEqual({ text: 'The QA did not send BUG-01.', isError: false });
    expect(did).toEqual(['confirm send_bug BUG-01 0 Jira · SHOP']);
  });

  it('does NOT send to a tracker that is not connected, or nowhere at all', async () => {
    const jiraOnly = fakePort({ state: { integrations: [JIRA] } });

    expect(
      await performBugSend({
        id: 'c-1',
        call: send({ repository: 'acme/shop' }),
        port: jiraOnly.port,
      }),
    ).toMatchObject({
      isError: true,
      text: expect.stringContaining('GitHub is not connected'),
    });

    const none = fakePort({ state: { integrations: [] } });

    expect(
      await performBugSend({ id: 'c-1', call: send(), port: none.port }),
    ).toMatchObject({
      isError: true,
      text: expect.stringContaining('Neither Jira nor GitHub is connected'),
    });

    const unknown = fakePort({
      state: { integrations: [JIRA], projects: [{ ...PROJECT, repositories: [] }] },
    });

    expect(
      await performBugSend({ id: 'c-1', call: send(), port: unknown.port }),
    ).toMatchObject({
      isError: true,
      text: expect.stringContaining('does not know where this project files its bugs'),
    });
    expect([...jiraOnly.did, ...none.did, ...unknown.did]).toEqual([]);
  });

  it('does NOT send a bug twice', async () => {
    const { port, did } = fakePort({
      state: {
        integrations: [JIRA],
        workspaces: [
          {
            ...CHECKOUT,
            bugs: CHECKOUT.bugs.map((bug) => ({
              ...bug,
              filed: {
                tracker: 'jira' as const,
                key: 'SHOP-40',
                url: 'https://acme.atlassian.net/browse/SHOP-40',
                at: '2026-10-21T10:00:00Z',
              },
            })),
          },
        ],
      },
    });

    expect(
      await performBugSend({ id: 'c-1', call: send({ project: 'SHOP' }), port }),
    ).toEqual({
      text: 'BUG-01 is already SHOP-40 in Jira: https://acme.atlassian.net/browse/SHOP-40',
      isError: false,
    });
    expect(did).toEqual([]);
  });

  it('says why the tracker refused it, in its words', async () => {
    const { port } = fakePort({
      state: { integrations: [JIRA] },
      filing: { isFiled: false, failure: 'rejected', said: 'Component/s is required.' },
    });

    expect(
      await performBugSend({ id: 'c-1', call: send({ project: 'SHOP' }), port }),
    ).toEqual({
      text: 'BUG-01 was not filed in Jira · SHOP: it refused the issue. Jira said: Component/s is required.',
      isError: true,
    });
  });

  it('names a bug that is not there among the ones that are', async () => {
    const { port } = fakePort({ state: { integrations: [JIRA] } });

    expect(
      await performBugSend({
        id: 'c-1',
        call: { name: 'send_bug', args: { workspace: 'w1', bug: 'BUG-09' } },
        port,
      }),
    ).toEqual({ text: 'w1 has no bug "BUG-09". Its bugs are BUG-01.', isError: true });
  });
});
