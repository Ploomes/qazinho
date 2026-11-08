import type { IBugFlash } from '@/modules/Device/types';
import type { IStepOutcome } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { BUG_FLASH } from '@/modules/Device/constants';
import { walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { withBugFlash } from '@/store/WorkspaceStore/library';

const workspace = walkRun({ verdicts: ['passed'] });

const outcome = (title: string): IStepOutcome => ({
  workspaceId: workspace.id,
  caseId: 'TC-01',
  stepNumber: 2,
  index: 1,
  action: 'Open the list',
  expected: 'a',
  verdict: 'failed',
  why: '',
  got: 'b',
  title,
  severity: 'medium',
  tookMs: 0,
  at: 1,
  screenshot: null,
  shotFile: null,
});

const flash = (id: string): IBugFlash => ({
  id,
  bugId: id,
  shot: null,
  title: id,
  category: null,
  isDesign: false,
  isSeenAgain: false,
  isQuiet: false,
});

describe('the queue of caught bugs', () => {
  it('starts one for a workspace that has none', () => {
    const flashes = withBugFlash({
      flashes: {},
      workspaces: [workspace],
      outcome: outcome('Total errado'),
      isIncidental: true,
    });

    expect(flashes[workspace.id]?.map(({ title }) => title)).toEqual(['Total errado']);
  });

  it('leaves it alone for a workspace it does not know', () => {
    const flashes = {};

    expect(
      withBugFlash({
        flashes,
        workspaces: [],
        outcome: outcome('Total errado'),
        isIncidental: true,
      }),
    ).toBe(flashes);
  });

  it('keeps the one on screen and drops the oldest waiting, so the screen never lags', () => {
    const waiting = Array.from({ length: BUG_FLASH.waitingKept }, (_, at) =>
      flash(`w${String(at)}`),
    );
    const queue = withBugFlash({
      flashes: { [workspace.id]: [flash('showing'), ...waiting] },
      workspaces: [workspace],
      outcome: outcome('Newest'),
      isIncidental: true,
    })[workspace.id];

    expect(queue).toHaveLength(BUG_FLASH.waitingKept + 1);
    expect(queue?.[0]?.id).toBe('showing');
    expect(queue?.map(({ id }) => id)).not.toContain('w0');
    expect(queue?.at(-1)?.title).toBe('Newest');
  });
});
