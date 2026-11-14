// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useChangeRunWarningViewModel } from '@/modules/Plan/components/ChangeRunWarning/hooks';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = {
  id: 'p1',
  name: 'Shop',
  targets: [{ id: 't1', kind: 'web' as const, label: 'Web', value: 'https://shop.test' }],
  repositories: [],
};

beforeEach(() => {
  useAppStore.setState({
    projects: [PROJECT],
    selectedWorkspaceId: null,
    screen: 'welcome',
  });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    changeHold: { workspaceId: 'w1', mode: 'agent' },
    panelTab: 'device',
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useChangeRunWarningViewModel', () => {
  it('names the plan whose sources changed', () => {
    const { result } = renderHook(() => useChangeRunWarningViewModel());

    expect(result.current).toMatchObject({
      title: 'Run with changes to review?',
      confirmLabel: 'Review first',
      runLabel: 'Run as it is',
    });
    expect(result.current.text).toContain('Checkout regression');
  });

  /** No teste de usabilidade, um plano sem nome deixava a frase com um buraco: "As fontes de mudaram". */
  it('names a plan with no name the way the sidebar shows it', () => {
    useWorkspaceStore.setState({ workspaces: [{ ...makeWorkspace(), name: '' }] });

    const { result } = renderHook(() => useChangeRunWarningViewModel());

    expect(result.current.text).toContain('New plan');
  });

  it('takes the QA to the plan to review, without running', () => {
    const startRun = vi.fn(() => Promise.resolve());

    window.qazinho = { ...fakeQazinhoApi('darwin'), startRun };

    const { result } = renderHook(() => useChangeRunWarningViewModel());

    act(() => {
      result.current.onConfirm();
    });

    expect(useWorkspaceStore.getState().changeHold).toBeNull();
    expect(useAppStore.getState().selectedWorkspaceId).toBe('w1');
    expect(useWorkspaceStore.getState().panelTab).toBe('plan');
    expect(startRun).not.toHaveBeenCalled();
  });

  it('runs as it is when the QA says so, with the run it held', () => {
    const startRun = vi.fn(() => Promise.resolve());

    window.qazinho = { ...fakeQazinhoApi('darwin'), startRun };

    const { result } = renderHook(() => useChangeRunWarningViewModel());

    act(() => {
      result.current.onRunAnyway();
    });

    expect(useWorkspaceStore.getState().changeHold).toBeNull();
    expect(startRun).toHaveBeenCalledOnce();
  });
});
