// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useOpenRun } from '@/modules/Run/hooks/useOpenRun';
import { useAppStore, useWorkspaceStore } from '@/store';

describe('useOpenRun', () => {
  it("opens the run's workspace on Runs, on that run, from wherever the QA was", () => {
    useAppStore.setState({ screen: 'settings', selectedWorkspaceId: 'w9' });
    useWorkspaceStore.setState({ tab: 'chat', selectedRunId: null });

    renderHook(() => useOpenRun()).result.current({ workspaceId: 'w1', runId: 'r-03' });

    expect(useAppStore.getState()).toMatchObject({
      screen: 'workspace',
      selectedWorkspaceId: 'w1',
    });
    expect(useWorkspaceStore.getState()).toMatchObject({
      tab: 'runs',
      selectedRunId: 'r-03',
    });
  });
});
