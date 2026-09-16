// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTitlebarViewModel } from '@/components/organisms/Titlebar/hooks/useTitlebarViewModel';
import { sample } from '@/modules/Resources/library/__tests__/fixtures';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useMachineStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({
    isResourcesOpen: false,
    modelMenuAt: null,
  });
  useMachineStore.setState({
    resources: { cpu: 0, ramMb: 0, ramCeilingGb: 32, processes: [] },
  });
});

describe('useTitlebarViewModel', () => {
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
      useAppStore.setState({ modelMenuAt: 'titlebar' });

      const { result } = renderHook(() => useTitlebarViewModel());

      act(() => {
        result.current.onToggleResources();
      });

      expect(useAppStore.getState().isResourcesOpen).toBe(true);
      expect(useAppStore.getState().modelMenuAt).toBeNull();
    });
  });

  describe('sessionTip', () => {
    it('spells out what is left of the session, when it resets, and the week', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.44,
          sevenDayUsed: 0.18,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      expect(result.current.sessionTip.rows).toEqual([
        {
          id: 'session',
          label: '5-hour session',
          value: '56% left',
          detail: null,
          fillWidth: '56%',
        },
        {
          id: 'week',
          label: 'This week',
          value: '82% left',
          detail: null,
          fillWidth: '82%',
        },
      ]);
    });

    it('does NOT invent a week the agent never reported', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.5,
          sevenDayUsed: null,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      const { result } = renderHook(() => useTitlebarViewModel());

      expect(result.current.sessionTip.rows.map(({ id }) => id)).toEqual(['session']);
    });
  });

  describe('sessionLabel', () => {
    it('does NOT promise a reset time the agent never gave', () => {
      useMachineStore.setState({
        usage: {
          fiveHourUsed: 0.4,
          sevenDayUsed: null,
          resetsAt: 0,
          contextTokens: 0,
          contextWindow: 0,
        },
      });

      expect(renderHook(() => useTitlebarViewModel()).result.current.sessionLabel).toBe(
        '60% session',
      );
    });
  });

  describe('contextShare', () => {
    beforeEach(() => {
      useWorkspaceStore.setState({
        workspaces: [
          { ...makeWorkspace(), id: 'w1', context: { tokens: 50_000, window: 200_000 } },
          { ...makeWorkspace(), id: 'w2', context: { tokens: 150_000, window: 200_000 } },
          { ...makeWorkspace(), id: 'w3', context: null },
        ],
      });
    });

    it('follows the workspace that is open', () => {
      useAppStore.setState({ screen: 'workspace', selectedWorkspaceId: 'w1' });

      expect(renderHook(() => useTitlebarViewModel()).result.current.contextShare).toBe(
        0.25,
      );

      useAppStore.setState({ selectedWorkspaceId: 'w2' });

      expect(renderHook(() => useTitlebarViewModel()).result.current.contextShare).toBe(
        0.75,
      );
    });

    it('does NOT show a ring for a workspace the agent has not answered yet', () => {
      useAppStore.setState({ screen: 'workspace', selectedWorkspaceId: 'w3' });

      expect(
        renderHook(() => useTitlebarViewModel()).result.current.contextShare,
      ).toBeNull();
    });

    it('shows no ring away from a workspace', () => {
      useAppStore.setState({ screen: 'settings', selectedWorkspaceId: 'w1' });

      expect(
        renderHook(() => useTitlebarViewModel()).result.current.contextShare,
      ).toBeNull();
    });
  });
});
