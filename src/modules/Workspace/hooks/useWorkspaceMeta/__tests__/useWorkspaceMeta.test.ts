// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceMeta } from '@/modules/Workspace/hooks/useWorkspaceMeta';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1', projects: [PROJECT] });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

describe('useWorkspaceMeta', () => {
  it('counts the cases on the app the plan runs on', () => {
    expect(renderHook(() => useWorkspaceMeta()).result.current).toEqual({
      metaKey: 'WORKSPACE.META_ON',
      metaCases: '2 cases',
    });
  });

  it('says one case, and no case yet, in words', () => {
    const [first] = makeWorkspace().plan;

    useWorkspaceStore.setState({
      workspaces: [{ ...makeWorkspace(), plan: first === undefined ? [] : [first] }],
    });
    expect(renderHook(() => useWorkspaceMeta()).result.current.metaCases).toBe('1 case');

    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), plan: [] }] });
    expect(renderHook(() => useWorkspaceMeta()).result.current.metaCases).toBe(
      'No cases yet',
    );
  });

  /** Sem o app no projeto, a frase não diz "em" nada: o link pede que o QA escolha. */
  it('asks for the app when the target left the project', () => {
    useAppStore.setState({ projects: [{ ...PROJECT, targets: [] }] });

    expect(renderHook(() => useWorkspaceMeta()).result.current.metaKey).toBe(
      'WORKSPACE.META_NO_APP',
    );
  });
});
