// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useSelectedWorkspace } from '@/shared/hooks/useSelectedWorkspace';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace(), { ...makeWorkspace(), id: 'w2', name: 'Other' }],
  });
});

function counted() {
  const renders = { count: 0 };
  const view = renderHook(() => {
    renders.count += 1;

    return useSelectedWorkspace();
  });

  return { renders, view };
}

describe('useSelectedWorkspace', () => {
  it('hands over the workspace the QA has open', () => {
    expect(counted().view.result.current?.id).toBe('w1');
  });

  it('follows the QA to another workspace', () => {
    const { view } = counted();

    act(() => {
      useAppStore.setState({ selectedWorkspaceId: 'w2' });
    });

    expect(view.result.current?.name).toBe('Other');
  });

  it('renders again when the open workspace changes', () => {
    const { renders } = counted();

    act(() => {
      useWorkspaceStore
        .getState()
        .renameWorkspace({ workspaceId: 'w1', name: 'Renamed' });
    });

    expect(renders.count).toBe(2);
  });

  it('does NOT render again when another workspace changes', () => {
    const { renders } = counted();

    act(() => {
      useWorkspaceStore
        .getState()
        .renameWorkspace({ workspaceId: 'w2', name: 'Renamed' });
    });

    expect(renders.count).toBe(1);
  });

  it('has nothing while no workspace is open', () => {
    useAppStore.setState({ selectedWorkspaceId: null });

    expect(counted().view.result.current).toBeNull();
  });
});
