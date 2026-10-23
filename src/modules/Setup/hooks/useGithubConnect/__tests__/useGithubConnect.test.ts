// @vitest-environment jsdom
import type { IGithubStatus } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGithubConnect } from '@/modules/Setup/hooks/useGithubConnect';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSetupStore } from '@/store';

const SIGNED_OUT: IGithubStatus = {
  cli: { isFound: true, path: '/opt/homebrew/bin/gh' },
  account: null,
  missingScopes: [],
  failure: 'signed-out',
};

const CONNECTED = {
  id: 'github' as const,
  account: 'octoqa',
  site: null,
  connectedAt: '2026-10-20T09:00:00.000Z',
};

beforeEach(() => {
  useSetupStore.setState({ integrations: [], installs: {} });
  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    githubStatus: vi.fn().mockResolvedValue(SIGNED_OUT),
  };
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useGithubConnect', () => {
  it("reads gh's status when it is on, and asks nothing when it is off", async () => {
    const on = renderHook(() => useGithubConnect({ isOn: true }));

    await waitFor(() => {
      expect(on.result.current.status).toEqual(SIGNED_OUT);
    });

    vi.mocked(window.qazinho.githubStatus).mockClear();
    renderHook(() => useGithubConnect({ isOn: false }));

    expect(window.qazinho.githubStatus).not.toHaveBeenCalled();
  });

  describe('onConnect', () => {
    it('signs gh in, then connects GitHub as the account gh came back as', async () => {
      window.qazinho.signInGithub = vi.fn().mockResolvedValue({
        steps: ['code', 'browser', 'account'],
        phase: 'connected',
        account: 'octoqa',
      });
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: true, status: CONNECTED });
      const { result } = renderHook(() => useGithubConnect({ isOn: true }));

      await act(async () => {
        result.current.onConnect();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(useSetupStore.getState().integrations).toEqual([CONNECTED]);
      });
      expect(window.qazinho.connectIntegration).toHaveBeenCalledWith({ id: 'github' });
      expect(result.current.signIn).toMatchObject({ phase: 'connected' });
    });

    it('does NOT keep GitHub when the vault refuses the account gh signed in as', async () => {
      window.qazinho.signInGithub = vi.fn().mockResolvedValue({
        steps: ['code', 'browser', 'account'],
        phase: 'connected',
        account: 'octoqa',
      });
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: false, failure: { reason: 'no-keychain' } });
      const { result } = renderHook(() => useGithubConnect({ isOn: true }));

      await act(async () => {
        result.current.onConnect();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.error).toContain('no keychain');
      });
      expect(result.current.signIn).toBeNull();
      expect(useSetupStore.getState().integrations).toEqual([]);
    });

    it('drops the popup when the sign-in was cancelled', async () => {
      window.qazinho.signInGithub = vi.fn().mockResolvedValue({
        steps: ['code', 'browser', 'account'],
        phase: 'cancelled',
      });
      const { result } = renderHook(() => useGithubConnect({ isOn: true }));

      await act(async () => {
        result.current.onConnect();
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(result.current.signIn).toBeNull();
      });
    });
  });

  describe('onCancelSignIn', () => {
    it('stops gh and closes the popup at once', () => {
      const cancel = vi.spyOn(window.qazinho, 'cancelGithubSignIn');
      const { result } = renderHook(() => useGithubConnect({ isOn: true }));

      act(() => {
        result.current.onCancelSignIn();
      });

      expect(cancel).toHaveBeenCalledTimes(1);
      expect(result.current.signIn).toBeNull();
    });
  });

  describe('onInstall', () => {
    it("installs gh, then reads gh's status again", async () => {
      window.qazinho.installTool = vi.fn().mockResolvedValue({ isInstalled: true });
      window.qazinho.checkMachine = vi.fn().mockResolvedValue({
        agents: [],
        tools: {
          androidSdk: { isFound: false, path: null },
          xcode: { isFound: false, path: null },
          idb: { isFound: false, path: null },
        },
        managers: {
          npm: { isFound: true, path: null },
          brew: { isFound: true, path: null },
        },
      });
      const { result } = renderHook(() => useGithubConnect({ isOn: true }));

      await waitFor(() => {
        expect(result.current.status).not.toBeNull();
      });
      vi.mocked(window.qazinho.githubStatus).mockClear();

      await act(() => result.current.onInstall());

      expect(window.qazinho.installTool).toHaveBeenCalledWith('gh');
      expect(window.qazinho.githubStatus).toHaveBeenCalledTimes(1);
    });
  });
});
