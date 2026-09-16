import { draftPlan } from '@/modules/Workspace/library';
import { describe, expect, it } from 'vitest';

describe('draftPlan', () => {
  it('numbers the cases from TC-01, the way the plan editor shows them', () => {
    const plan = draftPlan('web');

    expect(plan.map(({ id }) => id)).toEqual(['TC-01', 'TC-02', 'TC-03', 'TC-04']);
  });

  it('drafts different cases for a build than for a URL', () => {
    expect(draftPlan('web')[0]?.title).not.toBe(draftPlan('mobile')[0]?.title);
  });

  it('leaves every case without a verdict, because nothing has run yet', () => {
    expect(draftPlan('mobile').every(({ lastVerdict }) => lastVerdict === null)).toBe(
      true,
    );
  });
});
