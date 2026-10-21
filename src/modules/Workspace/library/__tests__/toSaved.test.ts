import type { IWorkspace } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from './fixtures';

const BROKE = ['passed', 'passed', 'passed', 'passed', 'failed'] as const;

function roundTrip(workspace: IWorkspace): IWorkspace | null {
  return fromSaved(toSaved({ workspace, at: '09:44' }));
}

describe('toSaved', () => {
  it('writes the plan as yaml, so a QA can read it in an editor', () => {
    const saved = toSaved({ workspace: makeWorkspace(), at: '09:44' });

    expect(saved.planYaml).toContain('cases:');
    expect(saved.planYaml).toContain('Open the store and find a product');
  });

  it('leaves the screenshots out, because they are already files on disk', () => {
    const saved = toSaved({
      workspace: walkRun({ verdicts: [...BROKE], isFinished: true }),
      at: '09:44',
    });

    expect(saved.json).not.toContain('data:image/jpeg');
    expect(saved.json).toContain('/tmp/qazinho/step-5.jpg');
  });

  /**
   * The saved file is what comes back if QAzinho closes now, and a run cannot outlive the app:
   * kept as live it would come back running with nothing driving it, and dropped it would leave
   * the bugs it found pointing at a run that is not there.
   */
  it('keeps a run in flight as one QAzinho interrupted, with what it walked so far', () => {
    const saved = JSON.parse(
      toSaved({ workspace: walkRun({ verdicts: ['passed', 'failed'] }), at: '09:44' })
        .json,
    ) as IWorkspace;

    expect(saved.live).toBeNull();
    expect(saved.status).toBe('failed');
    expect(saved.runs[0]).toMatchObject({
      id: 'r-01',
      endedBy: 'interrupted',
      counts: { passed: 1, failed: 1 },
    });
    expect(saved.chat.at(-1)).toMatchObject({
      kind: 'run',
      at: '09:44',
      endedBy: 'interrupted',
    });
  });

  it('comes back the way it went in', () => {
    const before = walkRun({ verdicts: [...BROKE], isFinished: true });
    const after = roundTrip(before);

    expect(after?.plan).toEqual(before.plan);
    expect(after?.chat).toEqual(before.chat);
    expect(after?.bugs[0]?.title).toBe(before.bugs[0]?.title);
    expect(after?.runs[0]?.counts).toEqual(before.runs[0]?.counts);
  });

  it('what came back knows where its screenshots are', () => {
    const after = roundTrip(walkRun({ verdicts: [...BROKE], isFinished: true }));

    expect(after?.bugs[0]?.shots.at(-1)?.src).toBeNull();
    expect(after?.bugs[0]?.shots.at(-1)?.file).toBe('/tmp/qazinho/step-5.jpg');
  });

  it('leaves the screenshot of a bug seen again out too, keeping where it is on disk', () => {
    const walked = walkRun({ verdicts: [...BROKE], isFinished: true });
    const [bug] = walked.bugs;
    const saved = toSaved({
      workspace: {
        ...walked,
        bugs: [
          {
            ...bug!,
            sightings: [
              {
                runId: 'r-02',
                runWhen: '10:05',
                caseId: 'TC-02',
                stepNumber: 2,
                at: 1_760_000_100_000,
                shot: {
                  isBad: true,
                  src: 'data:image/jpeg;base64,again',
                  file: '/tmp/qazinho/r-02/step-5.jpg',
                },
              },
            ],
          },
        ],
      },
      at: '10:10',
    });

    expect(saved.json).not.toContain('base64,again');
    expect(fromSaved(saved)?.bugs[0]?.sightings[0]?.shot.file).toBe(
      '/tmp/qazinho/r-02/step-5.jpg',
    );
  });
});
