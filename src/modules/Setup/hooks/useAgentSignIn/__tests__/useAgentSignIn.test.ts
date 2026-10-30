// @vitest-environment jsdom
import type { AgentSignInPhase, AgentSignInProgress } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAgentSignIn } from '@/modules/Setup/hooks/useAgentSignIn';
import { fakeQazinhoApi } from '@/services/__tests__/fixtures';
import { useMachineStore } from '@/store';

/**
 * Uma bridge cujos logins ficam abertos até o teste relatar os passos deles e
 * terminá-los, do jeito que a main faz.
 */
function bridge() {
  const listeners = new Set<(progress: AgentSignInProgress) => void>();
  const endings: ((progress: AgentSignInProgress) => void)[] = [];
  const api = {
    signInAgent: vi.fn(
      (_: string) =>
        new Promise<AgentSignInProgress>((end) => {
          endings.push(end);
        }),
    ),
    cancelAgentSignIn: vi.fn((_: string) => Promise.resolve()),
    onAgentSignIn: vi.fn((listener: (progress: AgentSignInProgress) => void) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    }),
    checkMachine: vi.fn(fakeQazinhoApi('darwin').checkMachine),
  };

  window.qazinho = { ...fakeQazinhoApi('darwin'), ...api };

  return {
    ...api,
    report: (progress: AgentSignInProgress) => {
      for (const listener of listeners) listener(progress);
    },
    end: (agentId: string, phase: AgentSignInPhase) => {
      endings.shift()?.({
        agentId,
        steps: ['start', 'browser'],
        ...phase,
      });
    },
  };
}

const IN_BROWSER: AgentSignInProgress = {
  agentId: 'claude-code',
  steps: ['start', 'browser'],
  phase: 'working',
  at: 'browser',
  url: 'https://claude.com/cai/oauth/authorize',
  opensAt: null,
};

beforeEach(() => {
  useMachineStore.setState({
    agents: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        command: 'claude',
        isFound: true,
        path: '/bin/claude',
        defaultModel: null,
        isSignedIn: false,
      },
    ],
  });
});

afterEach(() => {
  Reflect.deleteProperty(window, 'qazinho');
});

describe('useAgentSignIn', () => {
  it("opens on the first step at once, with the agent's name", async () => {
    const agent = bridge();
    const { result } = renderHook(() => useAgentSignIn());

    await act(async () => {
      result.current.onSignIn('claude-code');
    });

    expect(agent.signInAgent).toHaveBeenCalledWith('claude-code');
    expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'start' });
    expect(result.current.signInAgent).toBe('Claude Code');
  });

  it("follows the steps main reports for this agent, and not another's", async () => {
    const agent = bridge();
    const { result } = renderHook(() => useAgentSignIn());

    await act(async () => {
      result.current.onSignIn('claude-code');
    });
    act(() => {
      agent.report(IN_BROWSER);
      agent.report({ ...IN_BROWSER, agentId: 'codex', at: 'start', url: null });
    });

    expect(result.current.signIn).toMatchObject({ at: 'browser', url: IN_BROWSER.url });
  });

  it('checks the machine again once the agent is signed in', async () => {
    const agent = bridge();
    const { result } = renderHook(() => useAgentSignIn());

    await act(async () => {
      result.current.onSignIn('claude-code');
    });
    await act(async () => {
      agent.end('claude-code', { phase: 'connected' });
    });

    expect(result.current.signIn).toMatchObject({ phase: 'connected' });
    expect(agent.checkMachine).toHaveBeenCalled();
  });

  it('cancels: the popup closes at once, main is told to stop, and a late step does NOT reopen it', async () => {
    const agent = bridge();
    const { result } = renderHook(() => useAgentSignIn());

    await act(async () => {
      result.current.onSignIn('claude-code');
    });
    act(() => {
      result.current.onCancelSignIn();
    });

    expect(result.current.signIn).toBeNull();
    expect(agent.cancelAgentSignIn).toHaveBeenCalledWith('claude-code');

    act(() => {
      agent.report(IN_BROWSER);
    });
    await act(async () => {
      agent.end('claude-code', { phase: 'cancelled' });
    });

    expect(result.current.signIn).toBeNull();
  });

  it('starts over after a failure, when the QA asks', async () => {
    const agent = bridge();
    const { result } = renderHook(() => useAgentSignIn());

    await act(async () => {
      result.current.onSignIn('claude-code');
    });
    await act(async () => {
      agent.end('claude-code', {
        phase: 'failed',
        at: 'browser',
        failure: 'refused',
        said: 'Invalid code',
      });
    });
    await act(async () => {
      result.current.onRetrySignIn();
    });

    expect(agent.signInAgent).toHaveBeenCalledTimes(2);
    expect(result.current.signIn).toMatchObject({ phase: 'working', at: 'start' });
  });
});
