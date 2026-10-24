import { describe, expect, it } from 'vitest';
import { workspaceOfPlan } from '@/modules/Pro/library';
import { caseOf } from './mergeFixtures';

const PLAN = {
  workspaceId: 'w-1760000000001',
  name: 'Checkout com Pix',
  targetId: 't-android',
  targetKind: 'android' as const,
  issue: {
    key: 'LOJA-12',
    title: 'Pix',
    source: 'jira',
    url: 'https://loja.atlassian.net/browse/LOJA-12',
  },
  design: null,
  cases: [caseOf({ id: 'TC-01' })],
};

describe('workspaceOfPlan', () => {
  it('opens the plan as a workspace with nothing walked here yet', () => {
    expect(workspaceOfPlan({ plan: PLAN, projectId: 'p1' })).toMatchObject({
      id: 'w-1760000000001',
      projectId: 'p1',
      name: 'Checkout com Pix',
      targetId: 't-android',
      planKind: 'mobile',
      status: 'idle',
      issue: { key: 'LOJA-12', source: 'jira' },
      plan: [{ id: 'TC-01', lastVerdict: null }],
      runs: [],
      bugs: [],
      chat: [],
      live: null,
    });
  });

  it('leaves out a ticket from a tracker this computer does not know', () => {
    expect(
      workspaceOfPlan({
        plan: { ...PLAN, issue: { ...PLAN.issue, source: 'linear' } },
        projectId: 'p1',
      }).issue,
    ).toBeNull();
  });
});
