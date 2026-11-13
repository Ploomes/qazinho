import type { ITestCase } from '@/modules/Plan/types';
import type { IDraftedCase } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { planOfDraft } from '@/modules/Plan/library';

const CARD: IDraftedCase = {
  title: 'Checkout with a test card',
  priority: 'P1',
  goal: 'A card order goes through.',
  preconditions: 'One product in the cart.',
  steps: [{ action: 'Pay with the test card', expected: 'A confirmation appears' }],
};

const kept = (id: string, title: string): ITestCase => ({
  ...CARD,
  id,
  title,
  lastVerdict: 'failed',
});

const PLAN = [kept('TC-01', 'Login'), kept('TC-02', 'Search'), kept('TC-03', 'Delete')];

const fresh = (cases: IDraftedCase[]) => planOfDraft({ cases, plan: [], used: [] });

describe('planOfDraft', () => {
  it('numbers the cases of a first plan the way the plan editor shows them', () => {
    const plan = fresh([CARD, { ...CARD, title: 'Second' }]);

    expect(plan?.map(({ id }) => id)).toEqual(['TC-01', 'TC-02']);
    expect(plan?.[0]?.lastVerdict).toBeNull();
  });

  it('keeps a case the QA walks by hand that way when the agent keeps it, and no new one', () => {
    const plan = planOfDraft({
      cases: [
        { ...CARD, id: 'TC-02', title: 'Search, with filters' },
        { ...CARD, title: 'New' },
      ],
      plan: [{ ...kept('TC-02', 'Search'), isManual: true }],
      used: [],
    });

    expect(plan?.map(({ id, isManual }) => [id, isManual === true])).toEqual([
      ['TC-02', true],
      ['TC-03', false],
    ]);
  });

  it('refuses a plan with no case worth running', () => {
    expect(fresh([])).toBeNull();
  });

  it('drops a case whose steps say nothing, or that has no title, and numbers the rest in a row', () => {
    const plan = fresh([
      { ...CARD, title: 'Empty', steps: [{ action: ' ', expected: 'x' }] },
      { ...CARD, title: '  ' },
      { ...CARD, title: 'Real' },
    ]);

    expect(plan?.map(({ id, title }) => `${id} ${title}`)).toEqual(['TC-01 Real']);
  });

  it('trims what the agent wrote', () => {
    const plan = fresh([{ ...CARD, title: '  Padded  ', goal: ' g ' }]);

    expect(plan?.[0]).toMatchObject({ title: 'Padded', goal: 'g' });
  });

  it('keeps the Figma node a step’s screen should match, and none for a blank one', () => {
    const plan = fresh([
      {
        ...CARD,
        steps: [
          { action: 'Open the cart', expected: 'The cart', frame: ' 12:345 ' },
          { action: 'Pay', expected: 'Paid', frame: ' ' },
        ],
      },
    ]);

    expect(plan?.[0]?.steps).toEqual([
      { action: 'Open the cart', expected: 'The cart', frame: '12:345' },
      { action: 'Pay', expected: 'Paid' },
    ]);
  });

  it('keeps the id of every case the agent kept, when one in the middle was removed', () => {
    const plan = planOfDraft({
      cases: [
        { ...CARD, id: 'TC-01', title: 'Login' },
        { ...CARD, id: 'TC-03', title: 'Delete' },
      ],
      plan: PLAN,
      used: [],
    });

    expect(plan?.map(({ id }) => id)).toEqual(['TC-01', 'TC-03']);
  });

  it('gives a new case an id no case, run or bug ever used', () => {
    const plan = planOfDraft({
      cases: [
        { ...CARD, id: 'TC-01', title: 'Login' },
        { ...CARD, title: 'Empty search' },
      ],
      plan: PLAN,
      used: ['TC-04'],
    });

    expect(plan?.map(({ id }) => id)).toEqual(['TC-01', 'TC-05']);
  });

  it('knows a kept case by its title when the agent left its id out', () => {
    const plan = planOfDraft({
      cases: [{ ...CARD, title: 'Search' }],
      plan: PLAN,
      used: [],
    });

    expect(plan?.map(({ id }) => id)).toEqual(['TC-02']);
  });

  it('does NOT give one id to two cases, nor keep an id the plan never had', () => {
    const plan = planOfDraft({
      cases: [
        { ...CARD, id: 'TC-02', title: 'Search' },
        { ...CARD, id: 'TC-02', title: 'Search again' },
        { ...CARD, id: 'TC-99', title: 'Made up' },
      ],
      plan: PLAN,
      used: [],
    });

    expect(plan?.map(({ id }) => id)).toEqual(['TC-02', 'TC-04', 'TC-05']);
  });
});
