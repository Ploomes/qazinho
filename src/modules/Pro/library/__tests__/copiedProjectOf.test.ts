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

    expect(project).toEqual({
      ...PROJECT,
      id: 'p-42',
      name: 'Loja · copy',
      memories: [],
    });
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

  it('copies what the agent learned, each plan memory on the copy of its plan', () => {
    const memory = {
      text: 'Em Ajustes.',
      target: 'all' as const,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
      deletedAt: null,
    };
    const workspace = { ...makeWorkspace(), id: 'w1', projectId: 'p1', plan: [{}] };
    const { project } = copiedProjectOf({
      project: {
        ...PROJECT,
        memories: [
          { ...memory, id: 'a', scope: 'project', workspaceId: null },
          { ...memory, id: 'b', scope: 'plan', workspaceId: 'w1' },
          { ...memory, id: 'c', scope: 'plan', workspaceId: 'w-sem-plano' },
          {
            ...memory,
            id: 'd',
            scope: 'project',
            workspaceId: null,
            deletedAt: '2026-11-02T10:00:00.000Z',
          },
        ],
      },
      workspaces: [workspace as never],
      name: 'Cópia',
      now: 42,
    });

    expect(project.memories?.map(({ id, workspaceId }) => [id, workspaceId])).toEqual([
      ['a', null],
      ['b', 'w-42-0'],
    ]);
  });
});
