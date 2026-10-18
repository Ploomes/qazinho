import { describe, expect, it } from 'vitest';
import { appendPlanCard } from '@/modules/Chat/library';
import { CASES, makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

describe('appendPlanCard', () => {
  it('hands the plan to the Plan tab and leaves a card that counts it', () => {
    const workspace = appendPlanCard({
      workspace: makeWorkspace([]),
      plan: CASES,
      at: '09:41',
    });

    expect(workspace.plan).toEqual(CASES);
    expect(workspace.chat.at(-1)).toMatchObject({
      kind: 'plan',
      caseCount: 2,
      stepCount: 6,
    });
  });

  it('keeps what the last run said about the cases a change to the plan left alone', () => {
    const ran = makeWorkspace([
      { ...CASES[0]!, lastVerdict: 'passed' },
      { ...CASES[1]!, lastVerdict: 'failed' },
    ]);
    const changed = [
      CASES[0]!,
      { ...CASES[1]!, steps: [{ action: 'Pay', expected: 'A receipt' }] },
    ];

    expect(
      appendPlanCard({ workspace: ran, plan: changed, at: '09:41' }).plan.map(
        ({ lastVerdict }) => lastVerdict,
      ),
    ).toEqual(['passed', null]);
  });
});
