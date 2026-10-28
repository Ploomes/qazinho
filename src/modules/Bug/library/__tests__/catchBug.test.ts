import { describe, expect, it } from 'vitest';
import { catchBug } from '@/modules/Bug/library';
import { failedAgain, secondRun } from './fixtures';

describe('catchBug', () => {
  /**
   * A r-02 registrou o mesmo envio quebrado como BUG-03, ao lado do BUG-01 que a r-01
   * tinha registrado.
   */
  it('lands a step that fails again on its bug, seen in two runs, instead of a new one', () => {
    const workspace = secondRun();
    const caught = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    });

    expect(caught).toMatchObject({ bugId: 'BUG-01', how: 'again' });
    expect(caught.bugs).toHaveLength(1);
    expect(caught.bugs[0]?.seenRuns).toBe(2);
  });

  it('opens a new bug for one nothing open is', () => {
    const workspace = secondRun();
    const caught = catchBug({
      workspace,
      outcome: { ...failedAgain(workspace), caseId: 'TC-01', stepNumber: 1 },
      outcomes: [],
      isIncidental: true,
    });

    expect(caught).toMatchObject({ bugId: 'BUG-02', how: 'new' });
    expect(caught.bugs.at(-1)?.isIncidental).toBe(true);
  });

  it('does NOT count the same run twice for one bug', () => {
    const workspace = secondRun();
    const once = catchBug({
      workspace,
      outcome: failedAgain(workspace),
      outcomes: [],
      isIncidental: false,
    });
    const twice = catchBug({
      workspace: { ...workspace, bugs: once.bugs },
      outcome: { ...failedAgain(workspace), sameAs: 'BUG-01' },
      outcomes: [],
      isIncidental: true,
    });

    expect(twice.how).toBe('repeat');
    expect(twice.bugs).toBe(once.bugs);
  });

  /**
   * O agente registrou o cupom com bug, depois falhou o próprio passo por ele: um bug só,
   * o do plano.
   */
  it("makes a bug filed on the side the plan's once a plan step fails for it", () => {
    const workspace = secondRun();
    const aside = catchBug({
      workspace,
      outcome: {
        ...failedAgain(workspace),
        caseId: 'TC-01',
        stepNumber: 1,
        title: 'Coupon taken',
      },
      outcomes: [],
      isIncidental: true,
    });
    const failed = catchBug({
      workspace: { ...workspace, bugs: aside.bugs },
      outcome: {
        ...failedAgain(workspace),
        caseId: 'TC-01',
        stepNumber: 1,
        title: 'Coupon taken',
      },
      outcomes: [],
      isIncidental: false,
    });

    expect(failed).toMatchObject({ bugId: aside.bugId, how: 'repeat' });
    expect(failed.bugs.find(({ id }) => id === aside.bugId)?.isIncidental).toBe(false);
  });

  it("does NOT move a plan's bug outside the plan when a finding lands on it", () => {
    const workspace = secondRun();
    const caught = catchBug({
      workspace,
      outcome: { ...failedAgain(workspace), sameAs: 'BUG-01' },
      outcomes: [],
      isIncidental: true,
    });

    expect(caught.bugs.find(({ id }) => id === 'BUG-01')?.isIncidental).toBe(false);
  });
});
