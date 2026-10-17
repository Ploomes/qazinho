import type { IWorkspace } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { fromSaved, toSaved } from '@/modules/Workspace/library';
import { makeWorkspace, walkRun } from './fixtures';

const BROKE = ['passed', 'passed', 'passed', 'passed', 'failed'] as const;

function roundTrip(workspace: IWorkspace): IWorkspace | null {
  return fromSaved(toSaved(workspace));
}

describe('toSaved', () => {
  it('writes the plan as yaml, so a QA can read it in an editor', () => {
    const saved = toSaved(makeWorkspace());

    expect(saved.planYaml).toContain('cases:');
    expect(saved.planYaml).toContain('Open the store and find a product');
  });

  it('leaves the screenshots out, because they are already files on disk', () => {
    const saved = toSaved(walkRun({ verdicts: [...BROKE], isFinished: true }));

    expect(saved.json).not.toContain('data:image/jpeg');
    expect(saved.json).toContain('/tmp/qazinho/step-5.jpg');
  });

  it('a run in flight is not saved as still running, because nothing is', () => {
    const saved = toSaved(walkRun({ verdicts: ['passed'] }));

    expect(JSON.parse(saved.json)).toMatchObject({ live: null, status: 'idle' });
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
});
