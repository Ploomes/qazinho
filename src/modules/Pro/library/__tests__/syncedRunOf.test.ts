import { describe, expect, it } from 'vitest';
import { syncedRunOf } from '@/modules/Pro/library';
import {
  recordedRun,
  RECORDING,
  walkRun,
} from '@/modules/Workspace/library/__tests__/fixtures';

const TARGET = {
  id: 't1',
  kind: 'web' as const,
  label: 'Web',
  value: 'https://loja.dev',
};

describe('syncedRunOf', () => {
  it('sends a finished run with its steps, their screens and how each was walked', () => {
    const run = recordedRun(['passed', 'failed']).runs[0]!;
    const synced = syncedRunOf({ workspaceId: 'w1', run, target: TARGET });

    expect(synced).toMatchObject({
      workspaceId: 'w1',
      runId: 'r-01',
      kind: 'run',
      startedAt: new Date(RECORDING.startedAt).toISOString(),
      endedBy: 'finished',
      target: { kind: 'web', label: 'Web', value: 'https://loja.dev' },
      cases: [
        {
          id: 'TC-01',
          verdict: 'failed',
          steps: [
            {
              number: 1,
              verdict: 'passed',
              by: 'agent',
              proof: null,
              shotFile: '/tmp/qazinho/step-1.jpg',
            },
            {
              number: 2,
              verdict: 'failed',
              why: 'The page did not do it.',
              bugId: 'BUG-01',
            },
            { number: 3, verdict: 'skipped', shotFile: null },
          ],
        },
      ],
    });
    expect(synced?.cases[0]?.steps[0]).not.toHaveProperty('shot');
    expect(synced?.cases[0]?.steps[0]).not.toHaveProperty('span');
  });

  it('calls a step a stop left waiting skipped', () => {
    const run = recordedRun(['passed', 'failed']).runs[0]!;
    const waiting = {
      ...run,
      cases: run.cases.map((runCase) => ({
        ...runCase,
        verdict: 'running' as const,
        steps: runCase.steps.map((step) => ({ ...step, verdict: 'pending' as const })),
      })),
    };

    expect(
      syncedRunOf({ workspaceId: 'w1', run: waiting, target: TARGET })?.cases[0],
    ).toMatchObject({
      verdict: 'skipped',
      steps: [{ verdict: 'skipped' }, { verdict: 'skipped' }, { verdict: 'skipped' }],
    });
  });

  it('does NOT send a run that does not know when it started', () => {
    const run = walkRun({ verdicts: ['passed'], isFinished: true }).runs[0]!;

    expect(syncedRunOf({ workspaceId: 'w1', run, target: TARGET })).toBeNull();
  });
});
