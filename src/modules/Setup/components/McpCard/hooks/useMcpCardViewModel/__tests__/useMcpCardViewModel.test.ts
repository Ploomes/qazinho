// @vitest-environment jsdom
import type { IMcpServerStatus, McpActionResult, McpServerState } from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpCardViewModel } from '@/modules/Setup/components/McpCard/hooks/useMcpCardViewModel';
import { MCP_SERVERS } from '@/modules/Setup/constants';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useSettingsStore, useSetupStore } from '@/store';

const FIGMA = MCP_SERVERS[0]!;
const OK: McpActionResult = { ok: true };

/** A Claude Code whose Figma server moves through `states`, one per list call. */
function agentWith(props: {
  states: McpServerState[];
  add?: McpActionResult;
  signIn?: McpActionResult;
}) {
  const queue = [...props.states];
  const listMcpServers = vi.fn(() =>
    Promise.resolve<IMcpServerStatus[]>([
      { id: 'figma', state: queue.length > 1 ? queue.shift()! : queue[0]! },
    ]),
  );
  const addMcpServer = vi.fn(() => Promise.resolve(props.add ?? OK));
  const removeMcpServer = vi.fn(() => Promise.resolve(OK));
  const signInMcpServer = vi.fn(() => Promise.resolve(props.signIn ?? OK));

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listMcpServers,
    addMcpServer,
    removeMcpServer,
    signInMcpServer,
  };

  return { listMcpServers, addMcpServer, removeMcpServer, signInMcpServer };
}

const showing = (state: McpServerState | null) => {
  useSetupStore.setState({
    mcpServers: state === null ? null : [{ id: 'figma', state }],
  });

  return renderHook(() => useMcpCardViewModel({ server: FIGMA }));
};

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Claude Code' });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useMcpCardViewModel', () => {
  describe('what the card says', () => {
    it.each([
      { state: null, pill: 'running', label: 'checking', action: null },
      { state: 'missing', pill: 'idle', label: 'not added', action: 'Add and sign in' },
      {
        state: 'needs-auth',
        pill: 'attention',
        label: 'needs sign-in',
        action: 'Sign in',
      },
      { state: 'failed', pill: 'failed', label: 'not answering', action: 'Sign in' },
      { state: 'connected', pill: 'passed', label: 'connected', action: 'Remove' },
      { state: 'no-agent', pill: 'idle', label: 'needs Claude Code', action: null },
    ] as const)('when Claude Code reports $state', ({ state, pill, label, action }) => {
      agentWith({ states: ['missing'] });

      const { result } = showing(state);

      expect(result.current).toMatchObject({ pill, statusLabel: label, action });
    });

    it('says MCPs live in Claude Code when the default agent is another one', () => {
      agentWith({ states: ['missing'] });
      useSettingsStore.setState({ agent: 'Codex' });

      expect(showing('missing').result.current.note).toContain(
        'your default agent is Codex',
      );
    });
  });

  describe('onAction', () => {
    it('adds the server, then opens the sign-in and waits for it', async () => {
      const agent = agentWith({ states: ['needs-auth'] });
      const { result } = showing('missing');

      await act(() => result.current.onAction());

      expect(agent.addMcpServer).toHaveBeenCalledWith('figma');
      expect(agent.signInMcpServer).toHaveBeenCalledWith('figma');
      expect(result.current.waiting).toContain('pick figma');
    });

    it('does NOT open the sign-in when adding failed, and says why', async () => {
      const agent = agentWith({
        states: ['missing'],
        add: { ok: false, error: 'claude: no such command' },
      });
      const { result } = showing('missing');

      await act(() => result.current.onAction());

      expect(agent.signInMcpServer).not.toHaveBeenCalled();
      expect(result.current.error).toBe('claude: no such command');
      expect(result.current.waiting).toBeNull();
    });

    it('keeps checking while the QA signs in, and stops once it is connected', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      const agent = agentWith({ states: ['needs-auth', 'needs-auth', 'connected'] });
      const { result } = showing('needs-auth');

      await act(() => result.current.onAction());
      await act(() => vi.advanceTimersByTimeAsync(4_000));
      await waitFor(() => {
        expect(result.current.statusLabel).toBe('connected');
      });

      const calls = agent.listMcpServers.mock.calls.length;

      await act(() => vi.advanceTimersByTimeAsync(12_000));

      expect(agent.listMcpServers.mock.calls.length).toBe(calls);
      expect(result.current.waiting).toBeNull();
    });

    it('removes a connected server', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('connected');

      await act(() => result.current.onAction());

      expect(agent.removeMcpServer).toHaveBeenCalledWith('figma');
      expect(result.current.statusLabel).toBe('not added');
    });

    it('does nothing while Claude Code is missing', async () => {
      const agent = agentWith({ states: ['no-agent'] });
      const { result } = showing('no-agent');

      await act(() => result.current.onAction());

      expect(agent.addMcpServer).not.toHaveBeenCalled();
      expect(agent.signInMcpServer).not.toHaveBeenCalled();
    });
  });
});
