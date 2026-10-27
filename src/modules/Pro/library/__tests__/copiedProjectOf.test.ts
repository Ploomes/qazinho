import type { IProject } from '@/modules/Project/types';
import { describe, expect, it } from 'vitest';
import { copiedProjectOf } from '@/modules/Pro/library';
import {
  makeWorkspace,
  recordedRun,
} from '@/modules/Workspace/library/__tests__/fixtures';

const PROJECT: IProject = {
  id: 'p1',
  name: 'Loja',
  targets: [{ id: 't1', kind: 'web', label: 'Web', value: 'https://loja.dev' }],
  repositories: [{ id: '1', owner: 'salve', name: 'loja', baseBranch: 'main' }],
};

describe('copiedProjectOf', () => {
  it('makes a new project with the same targets and code, under the name given', () => {
    const { project } = copiedProjectOf({
      project: PROJECT,
      workspaces: [],
      name: 'Loja · copy',
      now: 42,
    });

    expect(project).toEqual({ ...PROJECT, id: 'p-42', name: 'Loja · copy' });
    expect(project.targets[0]).not.toBe(PROJECT.targets[0]);
  });

  it('carries each workspace’s plan alone, with nothing walked, under new ids', () => {
    const walked = recordedRun(['passed', 'failed']);
    const { workspaces } = copiedProjectOf({
      project: PROJECT,
      workspaces: [walked, { ...makeWorkspace(), id: 'w2', name: 'Login' }],
      name: 'Loja · copy',
      now: 42,
    });

    expect(workspaces.map(({ id, projectId, name }) => [id, projectId, name])).toEqual([
      ['w-42-0', 'p-42', walked.name],
      ['w-42-1', 'p-42', 'Login'],
    ]);
    expect(workspaces[0]).toMatchObject({
      targetId: walked.targetId,
      runs: [],
      bugs: [],
      chat: [],
      live: null,
      status: 'idle',
    });
    expect(workspaces[0]?.plan.map(({ id }) => id)).toEqual(
      walked.plan.map(({ id }) => id),
    );
    expect(workspaces[0]?.plan.every(({ lastVerdict }) => lastVerdict === null)).toBe(
      true,
    );
  });

  it('does NOT carry a workspace with no plan, nor one of another project', () => {
    const { workspaces } = copiedProjectOf({
      project: PROJECT,
      workspaces: [
        { ...makeWorkspace([]), id: 'empty' },
        { ...makeWorkspace(), id: 'other', projectId: 'p2' },
      ],
      name: 'Loja · copy',
      now: 42,
    });

    expect(workspaces).toEqual([]);
  });
});
