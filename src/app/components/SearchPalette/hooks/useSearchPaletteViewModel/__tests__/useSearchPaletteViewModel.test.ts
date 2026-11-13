// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSearchPaletteViewModel } from '@/app/components/SearchPalette/hooks/useSearchPaletteViewModel';
import { walkRun, makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const WEB = { id: 't1', kind: 'web' as const, label: 'Web', value: 'https://loja.test/' };
const LOJA = { id: 'p1', name: 'Loja Web', targets: [WEB], repositories: [] };

beforeEach(() => {
  useAppStore.setState({
    projects: [LOJA],
    screen: 'welcome',
    selectedWorkspaceId: null,
    isSearchOpen: true,
  });
  useWorkspaceStore.setState({
    workspaces: [{ ...makeWorkspace(), projectId: 'p1', targetId: 't1' }],
    panelTab: 'plan',
  });
});

describe('useSearchPaletteViewModel', () => {
  it('lists every plan with its project, the projects and the settings before a search', () => {
    const { result } = renderHook(() => useSearchPaletteViewModel());

    expect(result.current.items.map(({ label }) => label)).toEqual([
      'Checkout regression',
      'Loja Web',
      'Open Settings',
    ]);
    expect(result.current.items[0]?.detail).toBe('Loja Web');
  });

  it('offers to run a plan and to see its bugs once the QA types', () => {
    const failed = walkRun({ verdicts: ['failed'], isFinished: true });

    useWorkspaceStore.setState({
      workspaces: [{ ...failed, projectId: 'p1', targetId: 't1' }],
    });

    const { result } = renderHook(() => useSearchPaletteViewModel());

    act(() => {
      result.current.onQuery('checkout');
    });

    expect(result.current.items.map(({ label }) => label)).toEqual([
      'Checkout regression',
      'Run Checkout regression',
      'See the bug of Checkout regression',
    ]);
  });

  it('opens the bugs of a plan and closes itself', () => {
    const failed = walkRun({ verdicts: ['failed'], isFinished: true });

    useWorkspaceStore.setState({
      workspaces: [{ ...failed, projectId: 'p1', targetId: 't1' }],
    });

    const { result } = renderHook(() => useSearchPaletteViewModel());

    act(() => {
      result.current.onQuery('checkout');
    });
    act(() => {
      result.current.onPick(`bugs:${failed.id}`);
    });

    expect(useAppStore.getState()).toMatchObject({
      isSearchOpen: false,
      selectedWorkspaceId: failed.id,
    });
    expect(useWorkspaceStore.getState().panelTab).toBe('bugs');
  });

  it('says nothing matched, in the words the QA typed', () => {
    const { result } = renderHook(() => useSearchPaletteViewModel());

    act(() => {
      result.current.onQuery('zzz');
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.emptyText).toBe('Nothing with “zzz”.');
  });
});
