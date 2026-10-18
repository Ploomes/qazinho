import type { StepVerdict } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const BROKE: StepVerdict[] = ['passed', 'passed', 'passed', 'passed', 'failed'];

function bugFrom(verdicts: StepVerdict[] = BROKE) {
  return walkRun({ verdicts }).bugs[0]!;
}

describe('makeBug', () => {
  it('points at the step and the case that broke', () => {
    const bug = bugFrom();

    expect(bug.caseId).toBe('TC-02');
    expect(bug.caseTitle).toBe('Checkout with a test card');
    expect(bug.step).toBe('step 2');
  });

  it('carries what the QA expected, taken from the plan and not from the app', () => {
    expect(bugFrom().expected).toBe('An inline error asks for it');
  });

  it('takes the title and the severity the agent gave it', () => {
    const bug = bugFrom();

    expect(bug.title).toBe('Nothing happens on submit');
    expect(bug.severity).toBe('high');
  });

  it('reproduces from the top of its own case, not from the top of the plan', () => {
    const bug = bugFrom();

    expect(bug.repro.map(({ action }) => action)).toEqual([
      'Add the product to the cart',
      'Leave the house number empty',
    ]);
    expect(bug.repro.at(-1)?.isBad).toBe(true);
  });

  it('attaches the screenshot of the step before and the step that broke', () => {
    const bug = bugFrom();

    expect(bug.shots.map(({ label }) => label)).toEqual([
      'before',
      'the step that broke',
    ]);
    expect(bug.shots[1]?.src).toBe('data:image/jpeg;base64,shot-4');
  });

  it('a failure on the very first step has only its own screenshot', () => {
    const bug = bugFrom(['failed']);

    expect(bug.shots).toHaveLength(1);
    expect(bug.shots[0]?.isBad).toBe(true);
  });

  it('says it was seen once until a run before it caught the same thing', () => {
    expect(bugFrom().seen).toBe('once');
  });

  it('names the browser at the window size the run drove', () => {
    const phone = walkRun({
      workspace: { ...makeWorkspace(), viewportId: 'phone' },
      verdicts: BROKE,
    });

    expect(phone.bugs[0]?.target).toBe('Web · Chrome 390 × 844');
  });

  it('describes a phone when the target is a build', () => {
    const mobile = walkRun({
      workspace: { ...makeWorkspace(), planKind: 'mobile' },
      verdicts: BROKE,
    });

    expect(mobile.bugs[0]?.target).toBe('Android · emulator');
  });
});
