import { describe, expect, it } from 'vitest';
import { makeBug } from '@/modules/Bug/library';
import { flattenPlanSteps } from '@/modules/Run/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = makeWorkspace();
const STEP = flattenPlanSteps(WORKSPACE.plan)[4]!;

describe('makeBug', () => {
  it('points at the step and the case that broke', () => {
    const bug = makeBug({ workspace: WORKSPACE, step: STEP });

    expect(bug.caseId).toBe('TC-02');
    expect(bug.step).toBe('step 2');
  });

  it('carries what the QA expected, taken from the plan and not from the app', () => {
    const bug = makeBug({ workspace: WORKSPACE, step: STEP });

    expect(bug.expected).toBe('An inline error asks for it');
  });

  it('numbers itself after the bugs already caught', () => {
    const second = makeBug({
      workspace: { ...WORKSPACE, bugs: [makeBug({ workspace: WORKSPACE, step: STEP })] },
      step: STEP,
    });

    expect(second.id).toBe('BUG-02');
  });

  it('describes a phone when the target is a build', () => {
    const bug = makeBug({ workspace: { ...WORKSPACE, planKind: 'mobile' }, step: STEP });

    expect(bug.target).toBe('Android · Pixel 7');
    expect(bug.clipRatio).toBe('9 / 19.5');
  });
});
