import type { StepVerdict } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { makeBug } from '@/modules/Bug/library';
import {
  makeOutcome,
  makeWorkspace,
  WALKED_BY,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';

const BROKE: StepVerdict[] = ['passed', 'passed', 'passed', 'passed', 'failed'];

function bugFrom(verdicts: StepVerdict[] = BROKE) {
  return walkRun({ verdicts }).bugs[0]!;
}

describe('makeBug', () => {
  it('points at the step and the case that broke', () => {
    const bug = bugFrom();

    expect(bug.caseId).toBe('TC-02');
    expect(bug.caseTitle).toBe('Checkout with a test card');
    expect(bug.stepNumber).toBe(2);
  });

  it('carries what the QA expected, taken from the plan and not from the app', () => {
    expect(bugFrom().expected).toBe('An inline error asks for it');
  });

  it('names the bug after the step when the agent gave it no title, in the words of the plan', () => {
    const workspace = walkRun({ verdicts: [] });
    const outcome = {
      ...makeOutcome({ workspace, index: 0, verdict: 'failed' }),
      title: '',
    };

    expect(makeBug({ workspace, outcome, outcomes: [outcome] }).title).toBe(
      outcome.action,
    );
  });

  it('marks a step that failed off the design with its Figma frame, and no other', () => {
    const workspace = walkRun({ verdicts: [] });
    const outcome = makeOutcome({ workspace, index: 0, verdict: 'failed' });

    expect(
      makeBug({
        workspace,
        outcome: { ...outcome, frame: '1:6' },
        outcomes: [outcome],
      }).frame,
    ).toBe('1:6');
    expect(makeBug({ workspace, outcome, outcomes: [outcome] }).frame).toBeNull();
  });

  it('takes the title and the severity the agent gave it', () => {
    const bug = bugFrom();

    expect(bug.title).toBe('Nothing happens on submit');
    expect(bug.severity).toBe('high');
  });

  /**
   * A issue dizia só "1. Abrir o Carrinho": sem o estado de que o caso parte, quem a lia
   * não sabia como chegar ao bug.
   */
  it('reproduces from the state its own case starts in, then its steps, not the plan top', () => {
    const bug = bugFrom();

    expect(bug.repro.map(({ action }) => action)).toEqual([
      'One product in the cart.',
      'Add the product to the cart',
      'Leave the house number empty',
    ]);
    expect(bug.repro[0]?.isBad).toBe(false);
    expect(bug.repro.at(-1)?.isBad).toBe(true);
  });

  it('attaches the screenshot of the step before and the step that broke', () => {
    const bug = bugFrom();

    expect(bug.shots.map(({ isBad }) => isBad)).toEqual([false, true]);
    expect(bug.shots[1]?.src).toBe('data:image/jpeg;base64,shot-4');
  });

  it('a failure on the very first step has only its own screenshot', () => {
    const bug = bugFrom(['failed']);

    expect(bug.shots).toHaveLength(1);
    expect(bug.shots[0]?.isBad).toBe(true);
  });

  it('says it was seen once until a run before it caught the same thing', () => {
    expect(bugFrom().seenRuns).toBe(1);
  });

  it('names the browser at the window size the run drove', () => {
    const phone = walkRun({
      workspace: { ...makeWorkspace(), viewportId: 'phone' },
      verdicts: BROKE,
    });

    expect(phone.bugs[0]?.target).toBe('Web · Chrome 390 × 844');
  });

  it('names the phone the run walked on: an Android build, or an iOS one', () => {
    const on = (targetKind: 'android' | 'ios') =>
      walkRun({
        workspace: { ...makeWorkspace(), planKind: 'mobile' },
        verdicts: BROKE,
        by: { ...WALKED_BY, targetKind },
      }).bugs[0]?.target;

    expect(on('android')).toBe('Android');
    expect(on('ios')).toBe('iOS');
  });

  it('keeps the agent and the model that caught it, whatever the QA picks afterwards', () => {
    const bug = walkRun({
      verdicts: BROKE,
      by: { agent: 'Codex', modelName: null, targetKind: 'web' },
    }).bugs[0];

    expect(bug).toMatchObject({ agent: 'Codex', modelName: null });
  });

  it('says when it was caught: the moment its step came back', () => {
    expect(bugFrom().at).toBe(1_760_000_010_000);
  });
});
