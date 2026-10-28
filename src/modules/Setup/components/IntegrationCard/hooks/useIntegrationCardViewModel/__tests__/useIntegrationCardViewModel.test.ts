// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
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

const JIRA_CONNECTED = {
  id: 'jira' as const,
  account: 'Ana QA',
  site: 'https://acme.atlassian.net',
  connectedAt: '2026-09-16T12:00:00.000Z',
};

const JIRA_TYPED = { site: 'acme.atlassian.net', email: 'ana@acme.test', token: 't0k' };

beforeEach(() => {
  useSetupStore.setState({ integrations: [], installs: {}, connectingId: null });
  useSettingsStore.setState({ language: 'en' });
  window.qazinho = fakeQazinhoApi('darwin');
});

/**
 * Um cartão de um teste anterior ainda responderia a uma conexão que o assistente pede,
 * então cada teste desmonta o seu.
 */
afterEach(() => {
  cleanup();
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

function ghIs(status: { isFound: boolean; account: string | null }) {
  window.qazinho.githubStatus = vi.fn().mockResolvedValue({
    cli: {
      isFound: status.isFound,
      path: status.isFound ? '/opt/homebrew/bin/gh' : null,
    },
    account: status.account,
    missingScopes: [],
    failure: status.isFound ? (status.account === null ? 'signed-out' : null) : 'no-cli',
  });
}

describe('useIntegrationCardViewModel', () => {
  describe('GitHub, through the GitHub CLI', () => {
    it('offers to install gh when it is not on the machine, and installs it', async () => {
      ghIs({ isFound: false, account: null });
      let finish: (result: { isInstalled: boolean }) => void = () => undefined;

      window.qazinho.installTool = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(result.current.action).toBe('Install gh');
      });
      expect(result.current.cliLine).toBe(
        'gh is not on this machine yet. QAzinho installs it with Homebrew.',
      );

      let installing: Promise<void> = Promise.resolve();

      act(() => {
        installing = result.current.onAction();
      });

      expect(window.qazinho.installTool).toHaveBeenCalledWith('gh');
      expect(result.current.isActionBusy).toBe(true);
      expect(result.current.action).toBe('Installing gh…');

      await act(async () => {
        finish({ isInstalled: false });
        await installing;
      });
    });

    it('signs gh in on Connect, and never opens a form for a token', async () => {
      ghIs({ isFound: true, account: null });
      window.qazinho.signInGithub = vi.fn().mockReturnValue(new Promise(() => undefined));
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(result.current.cliLine).toBe('gh is here, not signed in to GitHub yet.');
      });

      await act(() => result.current.onAction());

      expect(window.qazinho.signInGithub).toHaveBeenCalledTimes(1);
      expect(result.current.isOpen).toBe(false);
      expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'code' });
    });

    it('does NOT start a second sign-in while one is under way', async () => {
      ghIs({ isFound: true, account: null });
      window.qazinho.signInGithub = vi.fn().mockReturnValue(new Promise(() => undefined));
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(result.current.cliLine).not.toBeNull();
      });
      await act(() => result.current.onAction());
      await act(() => result.current.onAction());

      expect(window.qazinho.signInGithub).toHaveBeenCalledTimes(1);
    });

    it('offers to connect as the account gh already signed in, not as not connected', async () => {
      ghIs({ isFound: true, account: 'octoqa' });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(result.current.cliLine).toBe(
          'gh is already signed in as octoqa: connecting uses that login.',
        );
      });
      expect(result.current.action).toBe('Connect as octoqa');
    });

    it('names whom gh is signed in as, and shows gh as the way GitHub connected', async () => {
      ghIs({ isFound: true, account: 'octoqa' });
      useSetupStore.setState({ integrations: [CONNECTED] });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(result.current.cliLine).toBe('gh is signed in as octoqa.');
      });
      expect(result.current.rows).toEqual([
        { label: 'account', value: 'octoqa' },
        { label: 'through', value: 'GitHub CLI' },
        { label: 'connected on', value: 'Sep 16, 2026' },
      ]);
    });
  });

  it('says gh comes with winget on Windows', async () => {
    window.qazinho = fakeQazinhoApi('win32');
    ghIs({ isFound: false, account: null });

    const { result } = renderHook(() =>
      useIntegrationCardViewModel({ integration: GITHUB }),
    );

    await waitFor(() => {
      expect(result.current.cliLine).toBe(
        'gh is not on this machine yet. QAzinho installs it with winget.',
      );
    });
  });

  describe('onAction', () => {
    it('opens the form of a tracker that is not connected', async () => {
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      await act(() => result.current.onAction());

      expect(result.current.isOpen).toBe(true);
      expect(result.current.hasAction).toBe(false);
      expect(result.current.fields.map(({ id }) => id)).toEqual([
        'site',
        'email',
        'token',
      ]);
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
        .mockResolvedValue({ isConnected: true, status: JIRA_CONNECTED });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      await act(() => result.current.onAction());
      typeInto(result, JIRA_TYPED);
      await act(() => result.current.onConnect());

      expect(window.qazinho.connectIntegration).toHaveBeenCalledWith({
        id: 'jira',
        ...JIRA_TYPED,
      });
      expect(result.current.isConnected).toBe(true);
      expect(result.current.rows).toEqual([
        { label: 'account', value: 'Ana QA' },
        { label: 'site', value: 'https://acme.atlassian.net' },
        { label: 'connected on', value: 'Sep 16, 2026' },
      ]);
    });

    it('keeps the form open with the reason when the tracker refuses', async () => {
      window.qazinho.connectIntegration = vi
        .fn()
        .mockResolvedValue({ isConnected: false, failure: { reason: 'unauthorized' } });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      await act(() => result.current.onAction());
      typeInto(result, JIRA_TYPED);
      await act(() => result.current.onConnect());

      expect(result.current.error).toBe(
        'Jira did not accept these credentials. Check the email and the token, and try again.',
      );
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
        .mockResolvedValue({ isConnected: false, failure: { reason: 'unauthorized' } });
      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      typeInto(result, JIRA_TYPED);
      await act(() => result.current.onConnect());
      typeInto(result, { token: 'nope2' });

      expect(result.current.error).toBe('');
    });
  });
  describe('a connection the assistant asked for', () => {
    it('starts signing gh in once gh answered, and asks only once', async () => {
      ghIs({ isFound: true, account: null });
      window.qazinho.signInGithub = vi.fn().mockReturnValue(new Promise(() => undefined));
      useSetupStore.setState({ connectingId: 'github' });

      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: GITHUB }),
      );

      await waitFor(() => {
        expect(window.qazinho.signInGithub).toHaveBeenCalledTimes(1);
      });
      expect(result.current.signIn).toMatchObject({ phase: 'working' });
      expect(useSetupStore.getState().connectingId).toBeNull();
    });

    it("opens Jira's form for the QA to type the token in, until they cancel it", () => {
      useSetupStore.setState({ connectingId: 'jira' });

      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.onCancel();
      });

      expect(result.current.isOpen).toBe(false);
      expect(useSetupStore.getState().connectingId).toBeNull();
    });

    it('does NOT act for another tracker, nor for one already connected', async () => {
      ghIs({ isFound: true, account: 'octoqa' });
      window.qazinho.signInGithub = vi.fn();
      useSetupStore.setState({ connectingId: 'jira' });

      renderHook(() => useIntegrationCardViewModel({ integration: GITHUB }));
      await waitFor(() => {
        expect(window.qazinho.githubStatus).toHaveBeenCalled();
      });

      expect(window.qazinho.signInGithub).not.toHaveBeenCalled();
      expect(useSetupStore.getState().connectingId).toBe('jira');

      useSetupStore.setState({ integrations: [JIRA_CONNECTED] });

      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      expect(result.current.isOpen).toBe(false);
      expect(useSetupStore.getState().connectingId).toBeNull();
    });
  });

  describe('onConfluence', () => {
    it('turns Confluence on beside a connected Jira once Confluence answers', async () => {
      useSetupStore.setState({ integrations: [JIRA_CONNECTED] });
      window.qazinho.switchConfluence = vi.fn().mockResolvedValue({
        isSwitched: true,
        status: { ...JIRA_CONNECTED, confluence: true },
      });

      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      expect(result.current.hasConfluence).toBe(true);
      expect(result.current.isConfluenceOn).toBe(false);

      await act(async () => {
        await result.current.onConfluence(true);
      });

      expect(window.qazinho.switchConfluence).toHaveBeenCalledWith(true);
      expect(result.current.isConfluenceOn).toBe(true);
      expect(result.current.confluenceError).toBe('');
    });

    it('does NOT turn it on when Confluence refuses, and says why in its words', async () => {
      useSetupStore.setState({ integrations: [JIRA_CONNECTED] });
      window.qazinho.switchConfluence = vi.fn().mockResolvedValue({
        isSwitched: false,
        failure: 'unauthorized',
        said: 'Current user not permitted to use Confluence',
      });

      const { result } = renderHook(() =>
        useIntegrationCardViewModel({ integration: JIRA }),
      );

      await act(async () => {
        await result.current.onConfluence(true);
      });

      expect(result.current.isConfluenceOn).toBe(false);
      expect(result.current.confluenceError).toBe(
        'Confluence refused this Jira account. Check that it can open Confluence on the same site. Current user not permitted to use Confluence',
      );
    });

    it('offers no Confluence on GitHub, nor on a Jira not connected', () => {
      useSetupStore.setState({ integrations: [CONNECTED] });

      expect(
        renderHook(() => useIntegrationCardViewModel({ integration: GITHUB })).result
          .current.hasConfluence,
      ).toBe(false);
      expect(
        renderHook(() => useIntegrationCardViewModel({ integration: JIRA })).result
          .current.hasConfluence,
      ).toBe(false);
    });
  });
});
