import type { IProShare } from '@/shared/types';
import { describe, expect, it } from 'vitest';
import { planUpdatesOf, syncedCaseOf } from '@/modules/Pro/library';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';

const WORKSPACE = makeWorkspace();
const BASE = WORKSPACE.plan.map(syncedCaseOf);
const FIRST = BASE[0]!;
const CHANGED_HERE = {
  ...WORKSPACE,
  plan: WORKSPACE.plan.map((one, index) =>
    index === 0 ? { ...one, title: 'Here' } : one,
  ),
};

const share: IProShare = {
  projectId: 'p1',
  orgSlug: 'loja',
  state: 'conflict',
  syncedAt: null,
  pending: [],
  conflicts: [
    {
      workspaceId: 'w1',
      base: BASE,
      version: 4,
      cases: [{ ...FIRST, title: 'Theirs' }, ...BASE.slice(1)],
      editedBy: 'Caio',
      editedAt: '2026-10-24T11:30:00.000Z',
    },
  ],
};

describe('planUpdatesOf', () => {
  it('joins each plan the org moved with this computer’s, naming the cases both changed', () => {
    const [update] = planUpdatesOf({ share, workspaces: [CHANGED_HERE] });

    expect(update?.cases[0]?.title).toBe('Here');
    expect(update?.clashes.map(({ id }) => id)).toEqual([FIRST.id]);
    expect(update?.isBusy).toBe(false);
  });

  it('keeps the side the QA chose for its workspace', () => {
    const [update] = planUpdatesOf({
      share,
      workspaces: [CHANGED_HERE],
      choices: { w1: { [FIRST.id]: 'theirs' } },
    });

    expect(update?.cases[0]?.title).toBe('Theirs');
  });

  it('leaves out a plan whose workspace is no longer here, and a project not linked', () => {
    expect(planUpdatesOf({ share, workspaces: [] })).toEqual([]);
    expect(planUpdatesOf({ share: undefined, workspaces: [WORKSPACE] })).toEqual([]);
  });

  it('says a plan a run holds is busy', () => {
    const [update] = planUpdatesOf({
      share,
      workspaces: [walkRun({ verdicts: [] })],
    });

    expect(update?.isBusy).toBe(true);
  });
});
