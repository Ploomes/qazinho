// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAgentPanelViewModel } from '@/modules/Workspace/components/AgentPanel/hooks/useAgentPanelViewModel';
import { PANEL } from '@/modules/Workspace/constants';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

function windowOf(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
}

beforeEach(() => {
  windowOf(1600);
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    panelTab: 'plan',
    isPanelOpen: true,
    panelWidth: PANEL.defaultWidth,
  });
});

describe('useAgentPanelViewModel', () => {
  it('opens beside the workspace, leaving room for its drag handle', () => {
    const { result } = renderHook(() => useAgentPanelViewModel());

    expect(result.current.isOpen).toBe(true);
    expect(result.current.width).toBe(PANEL.defaultWidth);
    expect(result.current.outerWidth).toBe(PANEL.defaultWidth + PANEL.handleWidth);
  });

  it('shrinks to a named rail when the QA collapses it', () => {
    useWorkspaceStore.setState({ isPanelOpen: false });

    const { result } = renderHook(() => useAgentPanelViewModel());

    expect(result.current.outerWidth).toBe(PANEL.railWidth);
    expect(result.current.railLabel).toBe('Agent');
  });

  it('toggles open and closed', () => {
    const { result } = renderHook(() => useAgentPanelViewModel());

    act(() => {
      result.current.onToggle();
    });

    expect(useWorkspaceStore.getState().isPanelOpen).toBe(false);
  });

  it('never lets a drag take the panel past its bounds', () => {
    const { result } = renderHook(() => useAgentPanelViewModel());

    act(() => {
      result.current.onResize(9000);
    });

    expect(useWorkspaceStore.getState().panelWidth).toBe(PANEL.maxWidth);

    act(() => {
      result.current.onResize(0);
    });

    expect(useWorkspaceStore.getState().panelWidth).toBe(PANEL.minWidth);
  });

  it('drops the width easing while the handle is dragged', () => {
    const { result } = renderHook(() => useAgentPanelViewModel());

    expect(result.current.widthTransition.duration).toBeGreaterThan(0);

    act(() => {
      result.current.onResizeStart();
    });

    expect(result.current.widthTransition.duration).toBe(0);
  });

  it('says it watches the run while one is live, and nothing otherwise', () => {
    const idle = renderHook(() => useAgentPanelViewModel());
    expect(idle.result.current.subtitle).toBe('');

    useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

    const live = renderHook(() => useAgentPanelViewModel());
    expect(live.result.current.subtitle).toBe('watches the run live');
  });
});
