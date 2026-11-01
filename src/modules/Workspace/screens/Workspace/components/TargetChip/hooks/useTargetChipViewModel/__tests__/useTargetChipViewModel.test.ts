// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useTargetChipViewModel } from '@/modules/Workspace/screens/Workspace/components/TargetChip/hooks/useTargetChipViewModel';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Carga',
  repositories: [],
  targets: [
    { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' },
    { id: 't-ios', kind: 'ios' as const, label: 'iOS', value: '/x/Carga-Release.app' },
  ],
};

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedWorkspaceId: 'w1',
    modal: null,
    editingProjectId: null,
  });
  useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });
});

describe('useTargetChipViewModel', () => {
  it('names the workspace target on the chip, with its build', () => {
    const vm = renderHook(() => useTargetChipViewModel()).result.current;

    expect(vm.hasWorkspace).toBe(true);
    expect(vm.current).toMatchObject({ kindLabel: 'Web', build: 'shop.test' });
  });

  it('lists every platform, the ones with a build apart from the empty ones', () => {
    const { result } = renderHook(() => useTargetChipViewModel());
    const byKind = Object.fromEntries(
      (result.current.options ?? []).map((option) => [option.kind, option]),
    );

    expect(byKind.ios).toMatchObject({ hasValue: true, value: 'Carga-Release.app' });
    expect(byKind.android).toMatchObject({ hasValue: false });
    expect(byKind.web).toMatchObject({ isActive: true });
  });

  it('runs the workspace on the platform the QA picks, drafting its plan kind', () => {
    const { result } = renderHook(() => useTargetChipViewModel());

    act(() => {
      result.current.options?.find((option) => option.kind === 'ios')?.onSelect();
    });

    expect(useWorkspaceStore.getState().workspaces[0]).toMatchObject({
      targetId: 't-ios',
      planKind: 'mobile',
    });
  });

  it('opens the project settings for anything deeper', () => {
    const { result } = renderHook(() => useTargetChipViewModel());

    act(() => {
      result.current.onMore?.();
    });

    expect(useAppStore.getState()).toMatchObject({
      modal: 'project',
      editingProjectId: 'p1',
    });
  });
});
