import { describe, expect, it } from 'vitest';
import { issueTargetIn } from '@/modules/Project/library';

describe('issueTargetIn', () => {
  it('reads a Jira project and a GitHub repository a project files its bugs in', () => {
    expect(issueTargetIn({ tracker: 'jira', project: 'SHOP' })).toEqual({
      tracker: 'jira',
      project: 'SHOP',
    });
    expect(
      issueTargetIn({ tracker: 'github', owner: 'acme', name: 'shop', extra: 1 }),
    ).toEqual({ tracker: 'github', owner: 'acme', name: 'shop' });
  });

  it('reads nowhere out of what is missing a part, or names another tracker', () => {
    expect(issueTargetIn({ tracker: 'jira', project: '' })).toBeUndefined();
    expect(issueTargetIn({ tracker: 'github', owner: 'acme' })).toBeUndefined();
    expect(issueTargetIn({ tracker: 'linear', project: 'X' })).toBeUndefined();
    expect(issueTargetIn(undefined)).toBeUndefined();
  });
});
