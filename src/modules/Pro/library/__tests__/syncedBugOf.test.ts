import type { IBug } from '@/modules/Bug/types';
import { describe, expect, it } from 'vitest';
import { syncedBugOf } from '@/modules/Pro/library';
import { recordedRun, RECORDING } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = recordedRun(['passed', 'failed']);
const BUG = WORKSPACE.bugs[0]!;

describe('syncedBugOf', () => {
  it('sends a bug first seen when its run started, with its screens as files', () => {
    const synced = syncedBugOf({ workspaceId: 'w1', bug: BUG, runs: WORKSPACE.runs });

    expect(synced).toMatchObject({
      workspaceId: 'w1',
      bugId: BUG.id,
      title: BUG.title,
      caseId: 'TC-01',
      stepNumber: 2,
      firstSeenAt: new Date(RECORDING.startedAt).toISOString(),
    });
    expect(
      synced?.shots.every(({ file }) => file === null || file.endsWith('.jpg')),
    ).toBe(true);
    expect(synced).not.toHaveProperty('review');
  });

  it('names the run that first caught it, at its moment on that run’s video', () => {
    const synced = syncedBugOf({
      workspaceId: 'w1',
      bug: { ...BUG, at: RECORDING.startedAt + 12_340 },
      runs: WORKSPACE.runs,
    });

    expect(synced?.caught).toEqual({
      runId: BUG.runId,
      runWhen: new Date(RECORDING.startedAt).toISOString(),
      caseId: 'TC-01',
      stepNumber: 2,
      shotFile: BUG.shots.find(({ isBad }) => isBad)?.file ?? null,
      at: 12.34,
    });
  });

  it('dates each sighting by its run and places it on its video, and leaves out a run it does not know', () => {
    const bug: IBug = {
      ...BUG,
      sightings: [
        {
          runId: 'r-01',
          runWhen: '09:41',
          caseId: 'TC-01',
          stepNumber: 2,
          at: RECORDING.startedAt + 3_000,
          shot: { isBad: true, src: null, file: '/data/runs/w1/r-01/step-2.jpg' },
        },
        {
          runId: 'r-09',
          runWhen: '11:00',
          caseId: 'TC-01',
          stepNumber: 2,
          at: null,
          shot: { isBad: true, src: null, file: null },
        },
      ],
    };

    expect(
      syncedBugOf({ workspaceId: 'w1', bug, runs: WORKSPACE.runs })?.sightings,
    ).toEqual([
      {
        runId: 'r-01',
        runWhen: new Date(RECORDING.startedAt).toISOString(),
        caseId: 'TC-01',
        stepNumber: 2,
        shotFile: '/data/runs/w1/r-01/step-2.jpg',
        at: 3,
      },
    ]);
  });

  it('names a build the bug was caught on by its file, not the folder on this machine', () => {
    expect(
      syncedBugOf({
        workspaceId: 'w1',
        bug: { ...BUG, target: '/Users/ana/loja.apk' },
        runs: WORKSPACE.runs,
      })?.target,
    ).toBe('loja.apk');
  });

  it('does NOT send a bug whose run does not know when it started', () => {
    expect(syncedBugOf({ workspaceId: 'w1', bug: BUG, runs: [] })).toBeNull();
  });
});
