import { describe, expect, it } from 'vitest';
import { namingWorkspaceOf } from '@/modules/Project/library';
import { blankWorkspaceOf } from '@/modules/Workspace/library';

const FIRST = blankWorkspaceOf({ projectId: 'p-1', name: 'Frete', now: 1 });
const SECOND = blankWorkspaceOf({ projectId: 'p-1', name: 'Testes', now: 2 });
const OTHER = blankWorkspaceOf({ projectId: 'p-2', name: 'Blog', now: 3 });
const WORKSPACES = [OTHER, FIRST, SECOND];

describe('namingWorkspaceOf', () => {
  it('tells the chat the QA has open, when it is of the project', () => {
    expect(
      namingWorkspaceOf({
        workspaces: WORKSPACES,
        projectId: 'p-1',
        selectedId: SECOND.id,
      }),
    ).toBe(SECOND.id);
  });

  it('tells the first chat of the project while the QA is somewhere else', () => {
    expect(
      namingWorkspaceOf({
        workspaces: WORKSPACES,
        projectId: 'p-1',
        selectedId: OTHER.id,
      }),
    ).toBe(FIRST.id);
    expect(
      namingWorkspaceOf({ workspaces: WORKSPACES, projectId: 'p-1', selectedId: null }),
    ).toBe(FIRST.id);
  });

  it('tells no chat when the project has none', () => {
    expect(
      namingWorkspaceOf({ workspaces: [OTHER], projectId: 'p-1', selectedId: OTHER.id }),
    ).toBeNull();
  });
});
