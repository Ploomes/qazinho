import { describe, expect, it } from 'vitest';
import { runFilesOf } from '@/main/classes/pro/ProSync/library';
import { RUN } from './fixtures';

describe('runFilesOf', () => {
  it('lists each screen once', () => {
    expect(runFilesOf({ ...RUN, cases: [...RUN.cases, ...RUN.cases] })).toEqual([
      '/data/runs/w1/r1/2.jpg',
    ]);
  });

  it('lists nothing for a run that kept no screen', () => {
    expect(
      runFilesOf({
        ...RUN,
        cases: RUN.cases.map((runCase) => ({
          ...runCase,
          steps: runCase.steps.map((step) => ({ ...step, shotFile: null })),
        })),
      }),
    ).toEqual([]);
  });
});
