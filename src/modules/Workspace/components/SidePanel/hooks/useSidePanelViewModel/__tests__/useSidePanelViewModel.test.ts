// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSidePanelViewModel } from '@/modules/Workspace/components/SidePanel/hooks/useSidePanelViewModel';
import { PANEL } from '@/modules/Workspace/constants';
import { makeWorkspace, walkRun } from '@/modules/Workspace/library/__tests__/fixtures';
import { SHELL } from '@/shared/constants';
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
    isPanelWide: false,
    panelWidth: PANEL.defaultWidth,
  });
});

describe('useSidePanelViewModel', () => {
  it('opens on the tab the QA left it on, with what each tab holds', () => {
    const { result } = renderHook(() => useSidePanelViewModel());

    expect(result.current.tab).toBe('plan');
    expect(result.current.planCount).toBe(2);
    expect(result.current.isLive).toBe(false);
  });

  describe('onSelectTab', () => {
    it('turns to the tab the QA picked', () => {
      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onSelectTab('bugs');
      });

      expect(result.current.tab).toBe('bugs');
    });

    it('opens the panel when a tab is asked for while it is hidden', () => {
      useWorkspaceStore.setState({ isPanelOpen: false });

      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onSelectTab('runs');
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('the device', () => {
    it('turns to the device when a run starts, the one tab it turns to on its own', () => {
      const { result, rerender } = renderHook(() => useSidePanelViewModel());

      act(() => {
        useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });
      });
      rerender();

      expect(result.current.tab).toBe('device');
      expect(result.current.isLive).toBe(true);
    });

    it('does NOT turn away from the tab the QA picked once the run is over', () => {
      useWorkspaceStore.setState({ workspaces: [walkRun({ verdicts: [] })] });

      const { result, rerender } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onSelectTab('plan');
      });
      act(() => {
        useWorkspaceStore.setState({
          workspaces: [walkRun({ verdicts: ['passed'], isFinished: true })],
        });
      });
      rerender();

      expect(result.current.tab).toBe('plan');
    });
  });

  describe('width', () => {
    it('makes room for the handle beside the content, so nothing is cut at the window edge', () => {
      const { result } = renderHook(() => useSidePanelViewModel());

      expect(result.current.outerWidth).toBe(PANEL.defaultWidth + PANEL.handleWidth);
      expect(result.current.style).toMatchObject({
        '--panel-width': `${String(PANEL.defaultWidth)}px`,
        '--panel-handle': `${String(PANEL.handleWidth)}px`,
      });
    });

    it('gives way in a small window, so the chat keeps the room it needs', () => {
      windowOf(1100);

      const { result } = renderHook(() => useSidePanelViewModel());

      expect(result.current.width).toBe(
        1100 - SHELL.sidebarWidth - SHELL.centerMinWidth - PANEL.handleWidth,
      );
      expect(useWorkspaceStore.getState().panelWidth).toBe(PANEL.defaultWidth);
    });

    it('narrows to the rail when hidden, named after the tab it holds', () => {
      useWorkspaceStore.setState({ isPanelOpen: false, panelTab: 'runs' });

      const { result } = renderHook(() => useSidePanelViewModel());

      expect(result.current.outerWidth).toBe(PANEL.railWidth);
      expect(result.current.railLabel).toBe('Runs');
    });

    it('never lets a drag take the panel past its bounds', () => {
      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onResize(9000);
      });

      expect(useWorkspaceStore.getState().panelWidth).toBe(PANEL.maxWidth);

      act(() => {
        result.current.onResize(10);
      });

      expect(useWorkspaceStore.getState().panelWidth).toBe(PANEL.minWidth);
    });
  });

  describe('onResizeStart', () => {
    it('follows the pointer with no easing while the handle is dragged', () => {
      const { result } = renderHook(() => useSidePanelViewModel());

      expect(result.current.widthTransition.duration).toBeGreaterThan(0);

      act(() => {
        result.current.onResizeStart();
      });

      expect(result.current.widthTransition.duration).toBe(0);
      expect(result.current.className).toBe('side-panel side-panel--resizing');

      act(() => {
        result.current.onResizeEnd();
      });

      expect(result.current.className).toBe('side-panel');
    });
  });

  describe('onWide', () => {
    it('widens over the chat, with no handle to drag, and brings the chat back', () => {
      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onWide();
      });

      expect(result.current.isWide).toBe(true);
      expect(result.current.canResize).toBe(false);
      expect(result.current.outerWidth).toBe(1600 - SHELL.sidebarWidth);
      expect(result.current.style).toMatchObject({
        '--panel-rest': `${String(PANEL.defaultWidth)}px`,
      });
      expect(result.current.wideLabel).toBe('Bring the chat back');

      act(() => {
        result.current.onWide();
      });

      expect(result.current.isWide).toBe(false);
      expect(result.current.wideLabel).toBe('Widen the panel over the chat');
    });

    it('lets the chat back when the panel is hidden', () => {
      useWorkspaceStore.setState({ isPanelWide: true });

      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        result.current.onToggle();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.isWide).toBe(false);
    });

    it('lets the chat back when the QA asks for it by name', () => {
      useWorkspaceStore.setState({ isPanelWide: true });

      const { result } = renderHook(() => useSidePanelViewModel());

      act(() => {
        useWorkspaceStore.getState().selectTab('chat');
      });

      expect(result.current.isWide).toBe(false);
      expect(result.current.tab).toBe('plan');
    });
  });
});
