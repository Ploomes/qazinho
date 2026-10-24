import { describe, expect, it } from 'vitest';
import { changedProjectsOf } from '@/modules/Pro/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const ONE = makeWorkspace();
const OTHER = { ...makeWorkspace(), id: 'w2', projectId: 'p2' };

describe('changedProjectsOf', () => {
  it('names the project of a workspace whose plan, runs or bugs changed', () => {
    const renamed = {
      ...ONE,
      plan: ONE.plan.map((one) => ({ ...one, title: `${one.title}!` })),
    };

    expect(
      changedProjectsOf({ workspaces: [renamed, OTHER], before: [ONE, OTHER] }),
    ).toEqual(['p1']);
  });

  it('does NOT count a live run’s clock, its chat or its status as a change', () => {
    const walking = walkRun({ verdicts: ['passed'] });
    const ticked = {
      ...walking,
      status: 'running' as const,
      chat: [],
      live:
        walking.live === null
          ? null
          : { ...walking.live, elapsedSec: walking.live.elapsedSec + 1 },
    };

    expect(changedProjectsOf({ workspaces: [ticked], before: [walking] })).toEqual([]);
  });

  it('names the project of a workspace added or gone', () => {
    expect(changedProjectsOf({ workspaces: [ONE, OTHER], before: [ONE] })).toEqual([
      'p2',
    ]);
    expect(changedProjectsOf({ workspaces: [ONE], before: [ONE, OTHER] })).toEqual([
      'p2',
    ]);
  });

  it('names both projects of a workspace moved from one to the other', () => {
    expect(
      changedProjectsOf({
        workspaces: [{ ...ONE, projectId: 'p2' }],
        before: [ONE],
      }).sort(),
    ).toEqual(['p1', 'p2']);
  });
});
