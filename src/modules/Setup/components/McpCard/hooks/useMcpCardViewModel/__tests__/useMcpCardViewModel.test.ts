// @vitest-environment jsdom
import type {
  IMcpServerStatus,
  McpActionResult,
  McpServerState,
  McpSignInResult,
} from '@/shared/types';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpCardViewModel } from '@/modules/Setup/components/McpCard/hooks/useMcpCardViewModel';
import { MCP_SERVERS } from '@/modules/Setup/constants';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const FIGMA = MCP_SERVERS[0]!;

/** An agent whose Figma server moves through `states`, one per list call, the last one staying. */
function agentWith(props: { states: McpServerState[]; connect?: McpSignInResult }) {
  const queue = [...props.states];
  const listMcpServers = vi.fn((_: string) =>
    Promise.resolve<IMcpServerStatus[]>([
      { id: 'figma', state: queue.length > 1 ? queue.shift()! : queue[0]! },
    ]),
  );
  const connectMcpServer = vi.fn(() =>
    Promise.resolve<McpSignInResult>(props.connect ?? { ok: true, via: 'terminal' }),
  );
  const removeMcpServer = vi.fn(() => Promise.resolve<McpActionResult>({ ok: true }));

  window.qazinho = {
    ...fakeQazinhoApi('darwin'),
    listMcpServers,
    connectMcpServer,
    removeMcpServer,
  };

  return { listMcpServers, connectMcpServer, removeMcpServer };
}

const showing = (state: McpServerState | null) => {
  useSetupStore.setState({
    mcpServers: state === null ? null : [{ id: 'figma', state }],
  });

  return renderHook(() => useMcpCardViewModel({ server: FIGMA }));
};

beforeEach(() => {
  useSettingsStore.setState({ agent: 'Codex' });
  useMachineStore.setState({
    agents: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        command: 'claude',
        isFound: true,
        path: '/bin/claude',
        defaultModel: null,
      },
      {
        id: 'codex',
        name: 'Codex',
        command: 'codex',
        isFound: true,
        path: '/bin/codex',
        defaultModel: null,
      },
    ],
  });
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
      { state: 'no-agent', pill: 'idle', label: 'agent not found', action: null },
      {
        state: 'unsupported',
        pill: 'idle',
        label: 'not for this agent yet',
        action: null,
      },
    ] as const)('when the agent reports $state', ({ state, pill, label, action }) => {
      agentWith({ states: ['missing'] });

      expect(showing(state).result.current).toMatchObject({
        pill,
        statusLabel: label,
        action,
      });
    });

    it('names the agent the MCP goes into, the one the QA picked', () => {
      agentWith({ states: ['missing'] });

      expect(showing('missing').result.current.needs).toContain('in Codex, your agent');
    });

    it('says which agents it works with when the QA picked another one', () => {
      agentWith({ states: ['unsupported'] });
      useSettingsStore.setState({ agent: 'Gemini CLI' });

      expect(showing('unsupported').result.current.note).toContain('not in Gemini CLI');
    });

    it('does NOT say checking forever when the list came back without it', () => {
      agentWith({ states: ['missing'] });
      useSetupStore.setState({ mcpServers: [] });

      const { result } = renderHook(() => useMcpCardViewModel({ server: FIGMA }));

      expect(result.current.statusLabel).toBe('not answering');
    });
  });

  describe('onAction', () => {
    it('connects through the agent the QA picked, and waits where it signs in', async () => {
      const agent = agentWith({
        states: ['needs-auth'],
        connect: { ok: true, via: 'browser' },
      });
      const { result } = showing('missing');

      await act(() => result.current.onAction());

      expect(agent.connectMcpServer).toHaveBeenCalledWith({
        id: 'figma',
        agentId: 'codex',
      });
      expect(agent.listMcpServers).toHaveBeenCalledWith('codex');
      expect(result.current.waiting).toContain('Finish in the browser');
    });

    it('waits in the terminal when the agent signs in there', async () => {
      agentWith({ states: ['needs-auth'], connect: { ok: true, via: 'terminal' } });
      useSettingsStore.setState({ agent: 'Claude Code' });

      const { result } = showing('needs-auth');

      await act(() => result.current.onAction());

      expect(result.current.waiting).toContain('pick figma');
    });

    it('does NOT wait when the sign-in did not start, and says why', async () => {
      agentWith({
        states: ['missing'],
        connect: { ok: false, error: 'codex: no such command' },
      });
      const { result } = showing('missing');

      await act(() => result.current.onAction());

      expect(result.current.error).toBe('codex: no such command');
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

      expect(agent.removeMcpServer).toHaveBeenCalledWith({
        id: 'figma',
        agentId: 'codex',
      });
      expect(result.current.statusLabel).toBe('not added');
    });

    it('does nothing for an agent it cannot set up', async () => {
      const agent = agentWith({ states: ['unsupported'] });
      const { result } = showing('unsupported');

      await act(() => result.current.onAction());

      expect(agent.connectMcpServer).not.toHaveBeenCalled();
    });
  });
});
