import { describe, expect, it } from 'vitest';
import { issueTargetOf } from '@/modules/Bug/library';

const REPOSITORY = { id: null, owner: 'acme', name: 'shop', baseBranch: 'main' };
const PROJECTS = [
  { key: 'OPS', name: 'Operações' },
  { key: 'SHOP', name: 'Loja' },
];
const BOTH = {
  kept: null,
  trackers: ['jira' as const, 'github' as const],
  story: null,
  projects: PROJECTS,
  repositories: [REPOSITORY],
};

describe('issueTargetOf', () => {
  it('sends where the project’s last bug went, while that tracker is connected', () => {
    expect(
      issueTargetOf({ ...BOTH, kept: { tracker: 'github', owner: 'acme', name: 'api' } }),
    ).toEqual({ tracker: 'github', owner: 'acme', name: 'api' });
    expect(
      issueTargetOf({
        ...BOTH,
        trackers: ['jira'],
        kept: { tracker: 'github', owner: 'acme', name: 'api' },
      }),
    ).toEqual({ tracker: 'jira', project: 'OPS' });
  });

  it('sends to the Jira project of the story the workspace works from', () => {
    expect(issueTargetOf({ ...BOTH, story: 'shop-12' })).toEqual({
      tracker: 'jira',
      project: 'SHOP',
    });
  });

  it('sends to the project’s first repository, else to the first Jira project listed', () => {
    expect(issueTargetOf(BOTH)).toEqual({
      tracker: 'github',
      owner: 'acme',
      name: 'shop',
    });
    expect(issueTargetOf({ ...BOTH, repositories: [] })).toEqual({
      tracker: 'jira',
      project: 'OPS',
    });
  });

  it('sends nowhere when no tracker is connected, or none has a place to send to yet', () => {
    expect(issueTargetOf({ ...BOTH, trackers: [] })).toBeNull();
    expect(issueTargetOf({ ...BOTH, trackers: ['github'], repositories: [] })).toBeNull();
  });
});
