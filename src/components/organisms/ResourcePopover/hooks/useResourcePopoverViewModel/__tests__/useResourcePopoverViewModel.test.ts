// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useResourcePopoverViewModel } from '@/components/organisms/ResourcePopover/hooks/useResourcePopoverViewModel';
import { startRun } from '@/modules/Workspace/library';
import { makeWorkspace } from '@/modules/Workspace/library/__tests__/fixtures';
import { useAppStore, useWorkspaceStore } from '@/store';

const PROJECT = { id: 'p1', name: 'Shop · staging', targets: [] };

beforeEach(() => {
  useAppStore.setState({ projects: [PROJECT], isResourcesOpen: true });
  useWorkspaceStore.setState({
    workspaces: [startRun({ workspace: makeWorkspace(), startedAt: '09:41' })],
  });
});

describe('useResourcePopoverViewModel', () => {
  it('counts what is actually running, not what merely exists', () => {
    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.processCount).toBe(2);
    expect(result.current.header).toBe('1 running · 2.2 GB');
  });

  it('says so plainly when the machine is quiet', () => {
    useWorkspaceStore.setState({ workspaces: [makeWorkspace()] });

    const { result } = renderHook(() => useResourcePopoverViewModel());

    expect(result.current.header).toBe('nothing running');
    expect(result.current.nodes).toEqual([]);
  });

  describe('onShutDown', () => {
    it('stops the run of the workspace whose device was shut down', () => {
      const { result } = renderHook(() => useResourcePopoverViewModel());

      act(() => {
        result.current.onShutDown('w1-device');
      });

      expect(useWorkspaceStore.getState().workspaces[0]?.status).toBe('stopped');
    });
  });
});
