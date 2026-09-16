// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDevicePanelViewModel } from '@/modules/Device/components/DevicePanel/hooks/useDevicePanelViewModel';
import { DEVICE } from '@/modules/Device/constants';
import { advanceRun, startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

beforeEach(() => {
  useAppStore.setState({ selectedWorkspaceId: 'w1' });
  useWorkspaceStore.setState({
    workspaces: [makeWorkspace()],
    isDevicePanelOpen: true,
    deviceWidth: DEVICE.defaultWidth,
  });
});

describe('useDevicePanelViewModel', () => {
  it('stays off and says so while no run has started', () => {
    const { result } = renderHook(() => useDevicePanelViewModel());

    expect(result.current.isOff).toBe(true);
    expect(result.current.stateText).toBe('idle');
  });

  it('describes the browser for a URL and the emulator for a build', () => {
    const { result } = renderHook(() => useDevicePanelViewModel());

    expect(result.current.deviceLabel).toBe('Chromium 1280 × 800');

    useWorkspaceStore.setState({
      workspaces: [{ ...makeWorkspace(), planKind: 'mobile' }],
    });

    const mobile = renderHook(() => useDevicePanelViewModel());

    expect(mobile.result.current.isPhone).toBe(true);
    expect(mobile.result.current.deviceLabel).toBe('Emulator · Pixel 7 · API 34');
  });

  it('marks the step the agent is on while it drives', () => {
    let workspace = startRun({ workspace: makeWorkspace(), startedAt: '09:41' });
    workspace = advanceRun(advanceRun(advanceRun(workspace)));
    useWorkspaceStore.setState({ workspaces: [workspace] });

    const { result } = renderHook(() => useDevicePanelViewModel());

    expect(result.current.isLive).toBe(true);
    expect(result.current.steps[0]?.verdict).toBe('passed');
    expect(result.current.steps[1]?.verdict).toBe('running');
    expect(result.current.doingLabel).toBe('1 of 6');
  });

  describe('onResize', () => {
    it('never lets the panel go past its bounds', () => {
      const { result } = renderHook(() => useDevicePanelViewModel());

      act(() => {
        result.current.onResize(9000);
      });

      expect(useWorkspaceStore.getState().deviceWidth).toBe(DEVICE.maxWidth);

      act(() => {
        result.current.onResize(10);
      });

      expect(useWorkspaceStore.getState().deviceWidth).toBe(DEVICE.minWidth);
    });
  });
});
