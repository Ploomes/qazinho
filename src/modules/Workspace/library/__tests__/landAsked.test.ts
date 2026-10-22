import { describe, expect, it } from 'vitest';
import { landAsked } from '@/modules/Workspace/library';
import { makeWorkspace, QUESTION, walkRun } from './fixtures';

describe('landAsked', () => {
  it('holds the run on the question, waited on for no time yet', () => {
    const asked = landAsked({
      workspace: walkRun({ verdicts: ['passed'] }),
      question: QUESTION,
    });

    expect(asked.live?.question).toEqual({ ...QUESTION, waitedSec: 0 });
  });

  it('does NOT ask anything of a run that is over, or of no run at all', () => {
    const over = walkRun({ verdicts: ['passed'], isFinished: true });
    const idle = makeWorkspace();

    expect(landAsked({ workspace: over, question: QUESTION })).toBe(over);
    expect(landAsked({ workspace: idle, question: QUESTION })).toBe(idle);
  });
});
