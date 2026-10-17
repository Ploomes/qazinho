// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useIntegrationCardViewModel } from '@/modules/Setup/components/IntegrationCard/hooks/useIntegrationCardViewModel';
import { INTEGRATIONS } from '@/modules/Setup/constants';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore, useSetupStore } from '@/store';

const [GITHUB, JIRA] = INTEGRATIONS;

if (!GITHUB || !JIRA) throw new Error('GitHub and Jira are both offered');

const CONNECTED = {
  id: 'github' as const,
  account: 'octoqa',
  site: null,
  connectedAt: '2026-09-16T12:00:00.000Z',
};

beforeEach(() => {
  useSetupStore.setState({ integrations: [] });
  useSettingsStore.setState({ language: 'en' });
  window.qazinho = fakeQazinhoApi('darwin');
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

function typeInto(
  result: { current: ReturnType<typeof useIntegrationCardViewModel> },
  values: Record<string, string>,
) {
  for (const [id, value] of Object.entries(values))
    act(() => {
      result.current.fields.find((field) => field.id === id)?.onChange(value);
    });
}

describe('useIntegrationCardViewModel', () => {
  describe('onAction', () => {
    it('opens the form of a tracker that is not connected', async () => {
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await act(() => result.current.onAction());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.hasAction).toBe(false);
      expect(result.current.fields.map(({ id }) => id)).toEqual(['token']);
    });

    it('disconnects a connected tracker, on the machine and on screen', async () => {
      useSetupStore.setState({ integrations: [CONNECTED] });
      const disconnect = vi.spyOn(window.qazinho, 'disconnectIntegration');
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await act(() => result.current.onAction());

      expect(disconnect).toHaveBeenCalledWith('github');
      expect(useSetupStore.getState().integrations).toEqual([]);
    });
  });

  describe('onConnect', () => {
    it('connects with what was typed, and shows the account it came back as', async () => {
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: true, status: CONNECTED });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await act(() => result.current.onAction());
      typeInto(result, { token: 'ghp_abc' });
      await act(() => result.current.onConnect());

      expect(window.qazinho.connectIntegration).toHaveBeenCalledWith({
        id: 'github',
        token: 'ghp_abc',
      });
      expect(result.current.isConnected).toBe(true);
      expect(result.current.rows).toEqual([
        { label: 'account', value: 'octoqa' },
        { label: 'connected on', value: 'Sep 16, 2026' },
      ]);
    });

    it('keeps the form open with the reason when the tracker refuses', async () => {
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: false, error: 'Bad token.' });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await act(() => result.current.onAction());
      typeInto(result, { token: 'nope' });
      await act(() => result.current.onConnect());

      expect(result.current.error).toBe('Bad token.');
      expect(result.current.isOpen).toBe(true);
    });

    it('does NOT ask Jira anything until the site, the email and the token are there', async () => {
      const connect = vi.spyOn(window.qazinho, 'connectIntegration');
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      typeInto(result, { site: 'acme.atlassian.net', token: 't' });

      expect(result.current.canConnect).toBe(false);

      await act(() => result.current.onConnect());

      expect(connect).not.toHaveBeenCalled();
    });

    it('clears the reason once the QA types again', async () => {
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: false, error: 'Bad token.' });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      typeInto(result, { token: 'nope' });
      await act(() => result.current.onConnect());
      typeInto(result, { token: 'nope2' });

      expect(result.current.error).toBe('');
    });
  });
});
