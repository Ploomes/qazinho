// @vitest-environment jsdom
import type { IAgentSignInProps } from '@/modules/Setup/components/AgentSignIn/types';
import type { AgentSignInPhase } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAgentSignInViewModel } from '@/modules/Setup/components/AgentSignIn/hooks/useAgentSignInViewModel';

function signingIn(phase: AgentSignInPhase) {
  const props: IAgentSignInProps = {
    agent: 'Claude Code',
    progress: {
      agentId: 'claude-code',
      steps: ['start', 'browser'],
      ...phase,
    },
    onCancel: vi.fn(),
    onClose: vi.fn(),
    onRetry: vi.fn(),
  };

  return { props, ...renderHook(() => useAgentSignInViewModel(props)) };
}

const keysOf = (actions: { key: string }[]) => actions.map(({ key }) => key);

describe('useAgentSignInViewModel', () => {
  it('opens the sign-in first, with nothing for the QA to do yet', () => {
    const { result } = signingIn({
      phase: 'working',
      at: 'start',
      opensAt: null,
    });

    expect(result.current).toMatchObject({
      tone: 'working',
      title: 'Signing in to Claude Code',
      hint: null,
      page: null,
    });
    expect(result.current.rows).toEqual([
      {
        key: 'start',
        label: 'Open the Claude Code sign-in in a terminal',
        state: 'active',
      },
      {
        key: 'browser',
        label: 'Sign in through the terminal and the page in your browser',
        state: 'pending',
      },
    ]);
    expect(keysOf(result.current.actions)).toEqual(['cancel']);
  });

  it('says the terminal opens in a few seconds, before it does', () => {
    const { result } = signingIn({
      phase: 'working',
      at: 'start',
      opensAt: Date.now() + 3_000,
    });

    expect(result.current.hint).toBe(
      'The Claude Code sign-in opens in a terminal in 3s.',
    );
    expect(result.current.page).toBeNull();
  });

  it('sends the QA to the terminal, with no page or code of its own', () => {
    const { result } = signingIn({ phase: 'working', at: 'browser', opensAt: null });

    expect(result.current.hint).toContain('Follow the terminal');
    expect(result.current.page).toBeNull();
    expect(result.current).not.toHaveProperty('code');
  });

  it('says the agent is signed in, with every step checked', () => {
    const { result } = signingIn({ phase: 'connected' });

    expect(result.current).toMatchObject({
      tone: 'connected',
      title: 'Claude Code is signed in',
    });
    expect(result.current.rows.every(({ state }) => state === 'done')).toBe(true);
    expect(keysOf(result.current.actions)).toEqual(['done']);
  });

  it('stops when it waited too long, and offers another try', () => {
    const { result } = signingIn({
      phase: 'failed',
      at: 'browser',
      failure: 'timeout',
      said: '',
    });

    expect(result.current).toMatchObject({
      tone: 'failed',
      subtitle: 'The sign-in did not finish in 5 minutes, so QAzinho stopped waiting.',
      detail: null,
    });
    expect(result.current.rows.map(({ state }) => state)).toEqual(['done', 'failed']);
    expect(keysOf(result.current.actions)).toEqual(['close', 'retry']);
  });

  it('shows the command to run when no terminal opened', () => {
    const { result } = signingIn({
      phase: 'failed',
      at: 'start',
      failure: 'terminal',
      said: '/usr/local/bin/claude auth login --claudeai',
    });

    expect(result.current.detail).toEqual({
      text: '/usr/local/bin/claude auth login --claudeai',
      isCommand: true,
    });
  });

  it('does NOT offer another try to an agent QAzinho cannot sign in', () => {
    const { result } = signingIn({
      phase: 'failed',
      at: 'start',
      failure: 'unsupported',
      said: '',
    });

    expect(keysOf(result.current.actions)).toEqual(['close']);
  });
});
