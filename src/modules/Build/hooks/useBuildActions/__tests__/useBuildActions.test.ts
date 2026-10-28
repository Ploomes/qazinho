// @vitest-environment jsdom
import type { IBuildResult, IStartBuild } from '@/shared/types';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useBuildActions } from '@/modules/Build/hooks/useBuildActions';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useBuildStore, useMachineStore, useSettingsStore } from '@/store';

/**
 * Uma bridge cujos builds terminam como o teste diz, lembrando o que foi pedido e parado.
 */
function bridge(result: IBuildResult) {
  const started: IStartBuild[] = [];
  const stopBuild = vi.fn(() => Promise.resolve());

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    startBuild: (build) => {
      started.push(build);

      return Promise.resolve(result);
    },
    stopBuild,
  };

  return { started, stopBuild };
}

beforeEach(() => {
  useBuildStore.setState({ builds: [] });
  useSettingsStore.setState({ agent: 'Codex', model: 'gpt-5', language: 'pt' });
  useMachineStore.setState({
    agents: [
      {
        id: 'codex',
        name: 'Codex',
        command: 'codex',
        isFound: true,
        path: '/bin/codex',
        defaultModel: null,
        isSignedIn: true,
      },
    ],
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useBuildActions', () => {
  describe('startBuild', () => {
    it('follows a new build and asks main for it with the agent the QA picked', async () => {
      const { started } = bridge({
        isBuilt: true,
        artifact: '/apps/p1/a.apk',
        bytes: 10,
        commit: 'c0ffee1',
        summary: '',
      });
      const { result } = renderHook(() => useBuildActions());
      let buildId = '';

      act(() => {
        buildId = result.current.startBuild({
          projectId: 'p1',
          platform: 'android',
          repository: { owner: 'acme', name: 'loja-app' },
          branch: 'main',
        });
      });

      expect(started).toEqual([
        {
          buildId,
          projectId: 'p1',
          platform: 'android',
          repository: { owner: 'acme', name: 'loja-app' },
          branch: 'main',
          agentId: 'codex',
          model: 'gpt-5',
          language: 'pt',
        },
      ]);
      expect(useBuildStore.getState().builds[0]).toMatchObject({
        id: buildId,
        repository: 'acme/loja-app',
        phase: 'working',
      });

      await waitFor(() => {
        expect(useBuildStore.getState().builds[0]?.phase).toBe('built');
      });
    });
  });

  describe('stopBuild', () => {
    it('asks main to stop the build', () => {
      const { stopBuild } = bridge({ isBuilt: false, failure: { reason: 'stopped' } });
      const { result } = renderHook(() => useBuildActions());

      result.current.stopBuild('b-1');

      expect(stopBuild).toHaveBeenCalledWith('b-1');
    });
  });
});
