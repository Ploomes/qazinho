import { describe, expect, it } from 'vitest';
import { suggestionsFor } from '@/modules/Assistant/library';

describe('suggestionsFor', () => {
  it('offers to read the latest run of the workspace on screen when it has one', () => {
    expect(suggestionsFor({ hasProjects: true, openRuns: 2 })).toEqual([
      'abilities',
      'lastRun',
      'summary',
      'newWorkspace',
    ]);
  });

  it('does NOT offer a run the workspace on screen does not have', () => {
    expect(suggestionsFor({ hasProjects: true, openRuns: 0 })).toEqual([
      'abilities',
      'summary',
      'newWorkspace',
      'theme',
    ]);
  });

  it('offers a first project to a QA with none, away from any workspace', () => {
    expect(suggestionsFor({ hasProjects: false, openRuns: null })).toEqual([
      'abilities',
      'firstProject',
      'theme',
    ]);
  });
});
