import type { SavedBug } from '@/modules/Workspace/types';
import { describe, expect, it } from 'vitest';
import { bugOfSaved } from '@/modules/Workspace/library';
import { walkRun } from './fixtures';

const BUG = walkRun({ verdicts: ['passed', 'failed'] }).bugs[0]!;

/**
 * Bugs used to keep their step and how often they were seen as English words ("step 2",
 * "2 runs in a row"), and a Portuguese QA read them that way. A file saved then still opens.
 */
describe('bugOfSaved', () => {
  it('reads a bug saved today as it was', () => {
    expect(bugOfSaved(BUG)).toEqual(BUG);
  });

  it('reads the step and the count out of the words an older bug kept', () => {
    const { stepNumber: _step, seenRuns: _seen, ...rest } = BUG;
    const older: SavedBug = { ...rest, step: 'step 4', seen: '3 runs in a row' };

    expect(bugOfSaved(older)).toMatchObject({ stepNumber: 4, seenRuns: 3 });
    expect(bugOfSaved(older)).not.toHaveProperty('step');
  });

  it('reads an older bug that never said who caught it as caught by nobody named', () => {
    const { agent: _agent, modelName: _model, ...older } = BUG;

    expect(bugOfSaved(older)).toMatchObject({ agent: '', modelName: null });
  });

  it('counts an older bug seen "once" as one run', () => {
    const { seenRuns: _seen, ...rest } = BUG;

    expect(bugOfSaved({ ...rest, seen: 'once' }).seenRuns).toBe(1);
  });

  it('drops the English label an older screenshot carried, which the card now writes itself', () => {
    const older = {
      ...BUG,
      shots: [{ label: 'the step that broke', isBad: true, src: null, file: '/s.jpg' }],
    };

    expect(bugOfSaved(older).shots).toEqual([{ isBad: true, src: null, file: '/s.jpg' }]);
  });

  it('reads an older bug as one the plan asked about', () => {
    const { isIncidental: _side, ...older } = BUG;

    expect(bugOfSaved(older).isIncidental).toBe(false);
  });

  it('reads an older bug as caught at no moment it can show', () => {
    const { at: _at, ...older } = BUG;

    expect(bugOfSaved(older).at).toBeNull();
  });

  it('reads an older bug as never seen again', () => {
    const { sightings: _sightings, ...older } = BUG;

    expect(bugOfSaved(older).sightings).toEqual([]);
  });
});
