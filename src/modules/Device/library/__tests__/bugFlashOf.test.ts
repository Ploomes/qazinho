import type { IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { BUG_FLASH } from '@/modules/Device/constants';
import { bugFlashOf } from '@/modules/Device/library';
import { endRun, landFinding, outcomeOfFinding } from '@/modules/Workspace/library';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const FINDING = {
  caseId: 'TC-01',
  stepNumber: 2,
  index: 1,
  action: 'Open the list',
  title: 'Title is 18px, Figma says 24px',
  severity: 'medium' as const,
  expected: '24px',
  got: '18px',
  at: 1_760_000_003_000,
  screenshot: 'data:image/jpeg;base64,caught',
  shotFile: '/tmp/qazinho/finding.jpg',
};

const outcome = (more: Partial<IStepOutcome> = {}): IStepOutcome => ({
  ...outcomeOfFinding({ workspaceId: 'w-1', finding: FINDING }),
  ...more,
});

describe('the bug a run just caught, as the screen shows it', () => {
  it('carries the screen, the words and the bug it fell into', () => {
    const flash = bugFlashOf({
      workspace: walkRun({ verdicts: ['passed'] }),
      outcome: outcome({ category: 'layout', frame: '12:345' }),
      isIncidental: true,
    });

    expect(flash).toMatchObject({
      bugId: 'BUG-01',
      shot: FINDING.screenshot,
      title: FINDING.title,
      category: 'layout',
      isDesign: true,
      isSeenAgain: false,
    });
  });

  it('has no kind and no design when the agent named neither', () => {
    expect(
      bugFlashOf({
        workspace: walkRun({ verdicts: ['passed'] }),
        outcome: outcome(),
        isIncidental: true,
      }),
    ).toMatchObject({ category: null, isDesign: false });
  });

  it('stays quiet about a bug this run has already shown', () => {
    const workspace = landFinding({
      workspace: walkRun({ verdicts: ['passed'] }),
      finding: FINDING,
      at: '22:18',
    });

    expect(bugFlashOf({ workspace, outcome: outcome(), isIncidental: true })).toBeNull();
  });

  it('stays quiet once the run is over', () => {
    const workspace = endRun({
      workspace: walkRun({ verdicts: ['passed'] }),
      at: '22:20',
      endedBy: 'finished',
    });

    expect(bugFlashOf({ workspace, outcome: outcome(), isIncidental: true })).toBeNull();
  });

  it('stays loud for the first bugs of a run, then goes quiet', () => {
    const landedSoFar = (count: number) => {
      let workspace = walkRun({ verdicts: ['passed'] });

      for (let at = 0; at < count; at += 1)
        workspace = landFinding({
          workspace,
          finding: { ...FINDING, title: `Bug ${String(at)}` },
          at: '22:18',
        });

      return workspace;
    };
    const quietOf = (count: number) =>
      bugFlashOf({
        workspace: landedSoFar(count),
        outcome: outcome({ title: 'Another one' }),
        isIncidental: true,
      })?.isQuiet;

    expect(quietOf(0)).toBe(false);
    expect(quietOf(BUG_FLASH.loudBugs - 1)).toBe(false);
    expect(quietOf(BUG_FLASH.loudBugs)).toBe(true);
  });
});
