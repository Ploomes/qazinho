import type { IProject } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { proBatchOf } from '@/modules/Pro/library';
import {
  makeWorkspace,
  recordedRun,
} from '@/modules/Workspace/library/__tests__/fixtures';

const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [
    { id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' },
    { id: 't2', kind: 'android', label: 'Android', value: '/Users/ana/builds/loja.apk' },
  ],
  repositories: [{ id: null, owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
  issueTarget: { tracker: 'jira', project: 'LOJA' } as never,
};

describe('proBatchOf', () => {
  it('sends the project with its targets as an org may read them', () => {
    const batch = proBatchOf({ project: PROJECT, workspaces: [] });

    expect(batch.project).toEqual({
      projectId: 'p1',
      name: 'Loja',
      targets: [
        { id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' },
        { id: 't2', kind: 'android', label: 'Android', value: 'loja.apk' },
      ],
      repositories: [{ id: null, owner: 'loja', name: 'loja-web', baseBranch: 'main' }],
    });
  });

  it('sends each workspace as a plan, with its runs and bugs', () => {
    const workspace = { ...recordedRun(['passed', 'failed']), design: null };
    const batch = proBatchOf({ project: PROJECT, workspaces: [workspace] });

    expect(batch.plans).toMatchObject([
      {
        workspaceId: 'w1',
        name: 'Checkout regression',
        targetId: 't1',
        targetKind: 'web',
        cases: [
          { id: 'TC-01', steps: [{ action: 'Open the target URL' }, {}, {}] },
          { id: 'TC-02' },
        ],
      },
    ]);
    expect(batch.plans[0]?.cases[0]).not.toHaveProperty('lastVerdict');
    expect(batch.runs.map(({ runId }) => runId)).toEqual(['r-01']);
    expect(batch.bugs.map(({ bugId }) => bugId)).toEqual([workspace.bugs[0]?.id]);
  });

  it('keeps a step’s frame only where the plan names one', () => {
    const workspace = makeWorkspace([
      {
        id: 'TC-01',
        title: 'Checkout',
        priority: 'P1',
        goal: '',
        preconditions: '',
        steps: [
          { action: 'Open', expected: 'Opens', frame: '12:34' },
          { action: 'Pay', expected: 'Paid' },
        ],
        lastVerdict: null,
      },
    ]);

    expect(
      proBatchOf({ project: PROJECT, workspaces: [workspace] }).plans[0]?.cases[0]?.steps,
    ).toEqual([
      { action: 'Open', expected: 'Opens', frame: '12:34' },
      { action: 'Pay', expected: 'Paid' },
    ]);
  });

  it('leaves out an empty workspace, another project’s and one whose target is gone', () => {
    const batch = proBatchOf({
      project: PROJECT,
      workspaces: [
        { ...makeWorkspace([]), id: 'empty' },
        { ...makeWorkspace(), id: 'other', projectId: 'p2' },
        { ...makeWorkspace(), id: 'lost', targetId: 't9' },
      ],
    });

    expect(batch.plans).toEqual([]);
    expect(batch.runs).toEqual([]);
  });
});
