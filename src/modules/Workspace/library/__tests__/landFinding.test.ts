import type { IRunFinding } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { endRun, landFinding } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from './fixtures';

const FINDING: IRunFinding = {
  caseId: 'TC-01',
  stepNumber: 2,
  index: 1,
  action: 'Search for a product',
  title: 'Yearly price differs',
  severity: 'medium',
  expected: 'One yearly price',
  got: '$20.49 on the page, $20.40 on the phone',
  screenshot: 'data:image/jpeg;base64,finding',
  shotFile: '/tmp/qazinho/finding-2-1.jpg',
};

describe('landFinding', () => {
  it('files a bug outside the plan, with the steps that led to it and what the screen showed', () => {
    const landed = landFinding({
      workspace: walkRun({ verdicts: ['passed'] }),
      finding: FINDING,
      at: '22:18',
    });
    const bug = landed.bugs.at(-1);

    expect(bug).toMatchObject({
      id: 'BUG-01',
      title: 'Yearly price differs',
      severity: 'medium',
      expected: 'One yearly price',
      got: '$20.49 on the page, $20.40 on the phone',
      caseId: 'TC-01',
      stepNumber: 2,
      runId: 'r-01',
      isIncidental: true,
      isNew: true,
    });
    expect(bug?.repro.map(({ action }) => action)).toEqual([
      'Open the target URL',
      'Search for a product',
    ]);
    expect(bug?.shots.at(-1)).toMatchObject({ isBad: true, file: FINDING.shotFile });
  });

  it("says so in the run's section of the chat", () => {
    const landed = landFinding({
      workspace: walkRun({ verdicts: ['passed'] }),
      finding: FINDING,
      at: '22:18',
    });

    expect(landed.chat.at(-1)).toMatchObject({
      kind: 'finding',
      runId: 'r-01',
      bugId: 'BUG-01',
      title: 'Yearly price differs',
    });
  });

  it('does NOT file a bug when no run is going', () => {
    const idle = makeWorkspace();

    expect(landFinding({ workspace: idle, finding: FINDING, at: '22:18' })).toBe(idle);
  });

  it('keeps a step on the bug it failed for, before one seen on its side, in the report', () => {
    const failedHere = walkRun({ verdicts: ['passed', 'failed'] });
    const seenToo = landFinding({ workspace: failedHere, finding: FINDING, at: '22:18' });
    const run = endRun({ workspace: seenToo, at: '22:19', endedBy: 'finished' }).runs[0];
    const step = run?.cases[0]?.steps[1];
    const failure = seenToo.bugs.find(({ isIncidental }) => !isIncidental);

    expect(step?.bugId).toBe(failure?.id);
  });
});
