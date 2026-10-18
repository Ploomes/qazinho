// @vitest-environment jsdom
import type {
  IMcpServerStatus,
  IMcpSignIn,
  McpActionResult,
  McpServerState,
  McpSignInPhase,
  McpSignInProgress,
} from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMcpCardViewModel } from '@/modules/Setup/components/McpCard/hooks/useMcpCardViewModel';
import { MCP_SERVERS } from '@/modules/Setup/constants';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore, useSettingsStore, useSetupStore } from '@/store';

const FIGMA = MCP_SERVERS[0]!;
const IN_CODEX = { id: 'figma' as const, agentId: 'codex' };
const STEPS = ['check', 'add', 'browser'] as const;

/**
 * An agent whose Figma server moves through `states`, one per list call, the last one staying.
 * A sign-in stays open until the test reports its steps and ends it, the way main does.
 */
function agentWith(props: { states: McpServerState[] }) {
  const queue = [...props.states];
  const listeners = new Set<(progress: McpSignInProgress) => void>();
  const endings: ((progress: McpSignInProgress) => void)[] = [];
  const api = {
    listMcpServers: vi.fn((_: string) =>
      Promise.resolve<IMcpServerStatus[]>([
        { id: 'figma', state: queue.length > 1 ? queue.shift()! : queue[0]! },
      ]),
    ),
    connectMcpServer: vi.fn(
      (_: IMcpSignIn) =>
        new Promise<McpSignInProgress>((end) => {
          endings.push(end);
        }),
    ),
    cancelMcpSignIn: vi.fn((_: unknown) => Promise.resolve()),
    onMcpSignIn: vi.fn((listener: (progress: McpSignInProgress) => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }),
    removeMcpServer: vi.fn((_: unknown) =>
      Promise.resolve<McpActionResult>({ ok: true }),
    ),
  };

  window.qazinho = { ...fakeQazinhoApi('darwin'), ...api };

  return {
    ...api,
    report: (progress: McpSignInProgress) => {
      for (const listener of listeners) listener(progress);
    },
    end: (phase: McpSignInPhase) => {
      endings.shift()?.({ target: IN_CODEX, steps: [...STEPS], ...phase });
    },
  };
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
        isSignedIn: true,
      },
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

    it('says which agents it works with, for an agent QAzinho has no recipe for yet', () => {
      agentWith({ states: ['unsupported'] });
      useSettingsStore.setState({ agent: 'Future CLI' });

      expect(showing('unsupported').result.current.note).toContain('not in Future CLI');
    });

    it('does NOT say checking forever when the list came back without it', () => {
      agentWith({ states: ['missing'] });
      useSetupStore.setState({ mcpServers: [] });

      const { result } = renderHook(() => useMcpCardViewModel({ server: FIGMA }));

      expect(result.current.statusLabel).toBe('not answering');
    });
  });

  describe('onAction', () => {
    it('signs in through the agent the QA picked, out of sight, showing the first step at once', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });

      expect(agent.connectMcpServer).toHaveBeenCalledWith({
        target: IN_CODEX,
        inTerminal: false,
      });
      expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'check' });
      expect(result.current).toMatchObject({ isBusy: true, action: 'Working…' });
    });

    it('does NOT start a second sign-in while one is open', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      await act(async () => {
        void result.current.onAction();
      });

      expect(agent.connectMcpServer).toHaveBeenCalledTimes(1);
    });

    it('removes a connected server', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('connected');

      await act(() => result.current.onAction());

      expect(agent.removeMcpServer).toHaveBeenCalledWith(IN_CODEX);
      expect(result.current.statusLabel).toBe('not added');
    });

    it('does nothing for an agent it cannot set up', async () => {
      const agent = agentWith({ states: ['unsupported'] });
      const { result } = showing('unsupported');

      await act(() => result.current.onAction());

      expect(agent.connectMcpServer).not.toHaveBeenCalled();
    });
  });

  describe('the sign-in under way', () => {
    it("follows the steps main reports for this server, and not another agent's", async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      act(() => {
        agent.report({
          target: IN_CODEX,
          steps: [...STEPS],
          phase: 'working',
          at: 'browser',
          url: 'https://www.figma.com/oauth',
          opensAt: null,
        });
      });

      expect(result.current.signIn).toMatchObject({ at: 'browser', steps: STEPS });

      act(() => {
        agent.report({
          target: { id: 'figma', agentId: 'claude-code' },
          steps: ['check'],
          phase: 'working',
          at: 'check',
          url: null,
          opensAt: null,
        });
      });

      expect(result.current.signIn).toMatchObject({ at: 'browser' });
    });

    it('shows how it ended, and reads the list again', async () => {
      const agent = agentWith({ states: ['connected'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      await act(async () => {
        agent.end({ phase: 'connected' });
      });

      expect(result.current.signIn).toMatchObject({ phase: 'connected' });
      expect(result.current.statusLabel).toBe('connected');
      expect(result.current.isBusy).toBe(true);

      act(() => {
        result.current.onCloseSignIn();
      });

      expect(result.current).toMatchObject({
        signIn: null,
        isBusy: false,
        action: 'Remove',
      });
    });

    it('cancels: the popup closes at once and main is told to stop', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      act(() => {
        result.current.onCancelSignIn();
      });

      expect(result.current.signIn).toBeNull();
      expect(agent.cancelMcpSignIn).toHaveBeenCalledWith(IN_CODEX);

      await act(async () => {
        agent.end({ phase: 'cancelled' });
      });

      expect(result.current.signIn).toBeNull();
    });

    it('does NOT reopen when a late step arrives after the popup closed', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      act(() => {
        result.current.onCloseSignIn();
        agent.report({
          target: IN_CODEX,
          steps: [...STEPS],
          phase: 'working',
          at: 'add',
          url: null,
          opensAt: null,
        });
      });

      expect(result.current.signIn).toBeNull();
    });

    it('tries again in Terminal after a failure, when the QA asks', async () => {
      const agent = agentWith({ states: ['missing'] });
      const { result } = showing('missing');

      await act(async () => {
        void result.current.onAction();
      });
      await act(async () => {
        agent.end({
          phase: 'failed',
          at: 'browser',
          failure: 'screen',
          said: '',
          canUseTerminal: true,
        });
      });

      expect(result.current.signIn).toMatchObject({ phase: 'failed', failure: 'screen' });

      await act(async () => {
        result.current.onSignInInTerminal();
      });

      expect(agent.connectMcpServer).toHaveBeenLastCalledWith({
        target: IN_CODEX,
        inTerminal: true,
      });
      expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'check' });
    });
  });
});
