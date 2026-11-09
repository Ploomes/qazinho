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

  describe('when the agent of a run asks the QA', () => {
    const asked = (id: string) => {
      const workspace = walkRun({ verdicts: [] });

      return {
        ...workspace,
        live:
          workspace.live === null
            ? null
            : {
                ...workspace.live,
                question: {
                  id,
                  question: 'Qual plano?',
                  options: [],
                  isSecret: false,
                  secret: { name: 'QA_ANSWER_1', description: 'Qual plano?' },
                  caseId: 'TC-01',
                  stepNumber: 1,
                  action: 'Escolher',
                  askedAtMs: 0,
                  waitsUntilMs: 900_000,
                  waitedSec: 0,
                },
              },
      };
    };

    /** A pergunta segura a run e mora no chat: recolhido, o QA não sabia que ela existia. */
    it('opens a collapsed chat, where the question is', () => {
      useWorkspaceStore.setState({ isPanelOpen: false, workspaces: [asked('q-1')] });
      renderHook(() => useAgentPanelViewModel());

      expect(useWorkspaceStore.getState().isPanelOpen).toBe(true);
    });

    it('lets the QA collapse it again while the same question waits', () => {
      useWorkspaceStore.setState({ workspaces: [asked('q-1')] });
      const { rerender } = renderHook(() => useAgentPanelViewModel());

      act(() => {
        useWorkspaceStore.setState({ isPanelOpen: false });
      });
      rerender();

      expect(useWorkspaceStore.getState().isPanelOpen).toBe(false);
    });

    it('does NOT open it with no question waiting', () => {
      useWorkspaceStore.setState({ isPanelOpen: false });
      renderHook(() => useAgentPanelViewModel());

      expect(useWorkspaceStore.getState().isPanelOpen).toBe(false);
    });
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
});
