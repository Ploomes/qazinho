import { describe, expect, it } from 'vitest';
import { landSuggestedCases, takeSuggestion } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const CASE = {
  title: 'Apply a coupon',
  priority: 'P1' as const,
  goal: 'The total drops.',
  preconditions: '',
  steps: [{ action: 'Type SAVE10', expected: 'The total drops by 10%' }],
};

describe('landSuggestedCases', () => {
  it('leaves the plan alone: the cases wait on a card that says where they came from', () => {
    const workspace = makeWorkspace();
    const landed = landSuggestedCases({
      workspace,
      summary: 'New coupon field.',
      cases: [CASE],
      at: '10:00',
    });

    expect(landed.plan).toEqual(workspace.plan);
    expect(landed.chat.at(-1)).toMatchObject({
      kind: 'suggestion',
      summary: 'New coupon field.',
      isTaken: false,
      from: 'outside',
    });
  });

  it('reaches the plan once the QA takes it', () => {
    const workspace = makeWorkspace();
    const landed = landSuggestedCases({
      workspace,
      summary: 'New coupon field.',
      cases: [CASE],
      at: '10:00',
    });
    const taken = takeSuggestion({
      workspace: landed,
      messageId: landed.chat.at(-1)?.id ?? '',
      at: '10:01',
    });

    expect(taken.plan.map(({ title }) => title)).toContain('Apply a coupon');
    expect(taken.plan.length).toBe(workspace.plan.length + 1);
  });

  /** O agente de fora disse que revisava o TC-06, e levar a sugestão somou um TC-09 igual. */
  it('changes the case a suggestion names, instead of adding another', () => {
    const workspace = makeWorkspace();
    const [first] = workspace.plan;
    const landed = landSuggestedCases({
      workspace,
      summary: 'A better first case.',
      cases: [{ ...CASE, id: first?.id ?? '' }],
      at: '10:00',
    });
    const taken = takeSuggestion({
      workspace: landed,
      messageId: landed.chat.at(-1)?.id ?? '',
      at: '10:01',
    });

    expect(taken.plan).toHaveLength(workspace.plan.length);
    expect(taken.plan[0]).toMatchObject({ id: first?.id, title: 'Apply a coupon' });
  });
});
