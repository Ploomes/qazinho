import { describe, expect, it } from 'vitest';
import { endedStateOf } from '@/modules/Island/library';
import { startRun } from '@/modules/Workspace/library';
import {
  makeOutcome,
  makeWorkspace,
  WALKED_BY,
} from '@/modules/Workspace/library/__tests__/fixtures';
import { endRun } from '@/modules/Workspace/library/endRun';
import { landStep } from '@/modules/Workspace/library/landStep';

describe('endedStateOf', () => {
  it('counts the steps that passed and the ones that failed, and nothing else', () => {
    let workspace = startRun({
      workspace: makeWorkspace(),
      startedAt: '10:00',
      runId: 'r-01',
      by: WALKED_BY,
    });

    for (const [index, verdict] of (
      ['passed', 'passed', 'failed', 'skipped'] as const
    ).entries())
      workspace = landStep({
        workspace,
        outcome: makeOutcome({ workspace, index, verdict }),
        at: '10:01',
      });

    expect(endedStateOf(endRun({ workspace, at: '10:05', endedBy: 'finished' }))).toEqual(
      {
        kind: 'ended',
        workspaceId: 'w1',
        name: 'Checkout regression',
        passed: 2,
        failed: 1,
      },
    );
  });

  it('reads zero from a workspace with no run', () => {
    expect(endedStateOf(makeWorkspace())).toMatchObject({ passed: 0, failed: 0 });
  });
});
