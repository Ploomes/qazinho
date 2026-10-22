import { describe, expect, it } from 'vitest';
import { landFiled } from '@/modules/Workspace/library';
import { walkRun } from './fixtures';

const ISSUE = {
  tracker: 'jira' as const,
  key: 'SHOP-57',
  url: 'https://acme.atlassian.net/browse/SHOP-57',
  at: '2026-10-22T12:00:00.000Z',
};

describe('landFiled', () => {
  it('lands the issue on the bug it was filed for', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });
    const [bug] = workspace.bugs;
    const landed = landFiled({ workspace, bugId: bug?.id ?? '', issue: ISSUE });

    expect(landed.bugs[0]?.filed).toEqual(ISSUE);
    expect(landed.bugs[0]?.reviewedRuns).toEqual(['r-01']);
  });

  it('changes nothing for a bug that is no longer there', () => {
    const workspace = walkRun({ verdicts: ['passed', 'failed'] });

    expect(landFiled({ workspace, bugId: 'BUG-99', issue: ISSUE })).toBe(workspace);
  });
});
