// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTitlebarViewModel } from '@/components/organisms/Titlebar/hooks/useTitlebarViewModel';
import { sample } from '@/modules/Resources/library/__tests__/fixtures';
import { useAppStore, useMachineStore } from '@/store';

const STAGING = { id: 'p1', name: 'Shop · staging', targets: [] };
const PRODUCTION = { id: 'p2', name: 'Shop · production', targets: [] };

beforeEach(() => {
  useAppStore.setState({
    projects: [],
    selectedProjectId: null,
    isResourcesOpen: false,
    isModelMenuOpen: false,
  });
  useMachineStore.setState({
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
  });
});

describe('useTitlebarViewModel', () => {
  it('has no project to switch to before the first one is created', () => {
    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.hasProjects).toBe(false);
    expect(result.current.projectName).toBeNull();
  });

  it('names the selected project', () => {
    useAppStore.setState({ projects: [STAGING, PRODUCTION], selectedProjectId: 'p2' });

    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.projectName).toBe('Shop · production');
  });

  it('falls back to the first project when the selection points nowhere', () => {
    useAppStore.setState({ projects: [STAGING, PRODUCTION], selectedProjectId: 'gone' });

    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.projectName).toBe('Shop · staging');
  });

  it('reads an idle machine as costing nothing', () => {
    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.cpuLabel).toBe('CPU 0%');
    expect(result.current.processLabel).toBe('0 processes');
  });

  it('reads what the machine reported, not a guess', () => {
    useMachineStore.setState({
      resources: {
        cpu: 16,
        ramMb: 2230,
        ramCeilingGb: 64,
        processes: [
          sample({ name: 'gocrash', kind: 'app', ramMb: 1800 }),
          sample({ name: 'claude', kind: 'agent', workspaceId: 'w1', ramMb: 430 }),
        ],
      },
    });

    const { result } = renderHook(() => useTitlebarViewModel());

    expect(result.current.processLabel).toBe('2 processes');
    expect(result.current.ramLabel).toBe('RAM 2.2 / 64 GB');
    expect(result.current.cpuLabel).toBe('CPU 16%');
  });

  describe('onToggleResources', () => {
    it('closes the model menu, because they share the same corner', () => {
      useAppStore.setState({ isModelMenuOpen: true });

      const { result } = renderHook(() => useTitlebarViewModel());

      act(() => {
        result.current.onToggleResources();
      });

      expect(useAppStore.getState().isResourcesOpen).toBe(true);
      expect(useAppStore.getState().isModelMenuOpen).toBe(false);
    });
  });
});
