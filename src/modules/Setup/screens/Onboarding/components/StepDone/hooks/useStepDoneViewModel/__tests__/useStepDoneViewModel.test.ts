// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useStepDoneViewModel } from '@/modules/Setup/screens/Onboarding/components/StepDone/hooks/useStepDoneViewModel';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const CLAUDE = {
  id: 'claude-code',
  name: 'Claude Code',
  command: 'claude',
  isFound: true,
  path: '/bin/claude',
  defaultModel: null,
};

beforeEach(() => {
  useMachineStore.setState({
    agents: [CLAUDE],
    tools: {
      androidSdk: { isFound: true, path: '/sdk' },
      xcode: { isFound: true, path: '/Applications/Xcode.app' },
      idb: { isFound: false, path: null },
    },
  });
  useSettingsStore.setState({ agent: 'Claude Code' });
  useSetupStore.setState({ integrations: [] });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

function rowOf(id: string) {
  const { result } = renderHook(() => useStepDoneViewModel());

  return result.current.rows.find((row) => row.id === id);
}

describe('useStepDoneViewModel', () => {
  it('names the agent in use when it is on this machine', () => {
    expect(rowOf('agent')).toMatchObject({ value: 'Claude Code', isReady: true });
  });

  it('does NOT call the agent ready when the one picked is not installed', () => {
    useSettingsStore.setState({ agent: 'Codex' });

    expect(rowOf('agent')?.isReady).toBe(false);
  });

  it('calls iOS ready only with Xcode and idb both here', () => {
    expect(rowOf('ios')?.isReady).toBe(false);

    useMachineStore.setState({
      tools: {
        androidSdk: { isFound: true, path: '/sdk' },
        xcode: { isFound: true, path: '/Applications/Xcode.app' },
        idb: { isFound: true, path: '/bin/idb' },
      },
    });

    expect(rowOf('ios')?.isReady).toBe(true);
  });

  it('lists the trackers connected, with the account of each', () => {
    useSetupStore.setState({
      integrations: [{ id: 'github', account: 'octoqa', site: null, connectedAt: '' }],
    });

    expect(rowOf('trackers')).toMatchObject({ value: 'GitHub · octoqa', isReady: true });
  });
});
