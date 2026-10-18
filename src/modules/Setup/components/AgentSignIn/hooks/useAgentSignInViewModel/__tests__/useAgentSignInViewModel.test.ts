// @vitest-environment jsdom
import type { IAgentSignInProps } from '@/modules/Setup/components/AgentSignIn/types';
import type { AgentSignInPhase } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAgentSignInViewModel } from '@/modules/Setup/components/AgentSignIn/hooks/useAgentSignInViewModel';

function signingIn(phase: AgentSignInPhase, takesCode = true) {
  const props: IAgentSignInProps = {
    agent: 'Claude Code',
    progress: {
      agentId: 'claude-code',
      steps: ['start', 'browser'],
      takesCode,
      ...phase,
    },
    onCancel: vi.fn(),
    onClose: vi.fn(),
    onRetry: vi.fn(),
    onCode: vi.fn(),
  };

  return { props, ...renderHook(() => useAgentSignInViewModel(props)) };
}

const keysOf = (actions: { key: string }[]) => actions.map(({ key }) => key);

describe('useAgentSignInViewModel', () => {
  it('opens the sign-in first, with nothing for the QA to do yet', () => {
    const { result } = signingIn({
      phase: 'working',
      at: 'start',
      url: null,
      opensAt: null,
    });

    expect(result.current).toMatchObject({
      tone: 'working',
      title: 'Signing in to Claude Code',
      hint: null,
      page: null,
      code: null,
    });
    expect(result.current.rows).toEqual([
      { key: 'start', label: 'Open the Claude Code sign-in', state: 'active' },
      { key: 'browser', label: 'Sign in on the page in your browser', state: 'pending' },
    ]);
    expect(keysOf(result.current.actions)).toEqual(['cancel']);
  });

  it('says the page opens in a few seconds, before the agent opens it', () => {
    const { result } = signingIn({
      phase: 'working',
      at: 'start',
      url: null,
      opensAt: Date.now() + 3_000,
    });

    expect(result.current.hint).toBe(
      'The Claude Code sign-in page opens in your browser in 3s.',
    );
    expect(result.current).toMatchObject({ page: null, code: null });
  });

  it('points at the page in the browser, with a field for the code it may show', () => {
    const { result, props } = signingIn({
      phase: 'working',
      at: 'browser',
      url: 'https://claude.com/cai/oauth/authorize',
      opensAt: null,
    });

    expect(result.current.hint).toContain('The Claude Code sign-in page opened');
    expect(result.current.page).toEqual({
      url: 'https://claude.com/cai/oauth/authorize',
      label: 'Open the page again ↗',
    });

    result.current.code?.onSubmit('abc-123');

    expect(props.onCode).toHaveBeenCalledWith('abc-123');
  });

  it('does NOT ask for a code an agent never takes', () => {
    expect(
      signingIn(
        {
          phase: 'working',
          at: 'browser',
          url: 'https://auth.openai.com/oauth',
          opensAt: null,
        },
        false,
      ).result.current.code,
    ).toBeNull();
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

  it("stops with the agent's words, and offers another try", () => {
    const { result } = signingIn({
      phase: 'failed',
      at: 'browser',
      failure: 'refused',
      said: 'Invalid code',
    });

    expect(result.current).toMatchObject({
      tone: 'failed',
      subtitle: 'The sign-in did not go through.',
      detail: { text: 'Invalid code', isCommand: false },
    });
    expect(result.current.rows.map(({ state }) => state)).toEqual(['done', 'failed']);
    expect(keysOf(result.current.actions)).toEqual(['close', 'retry']);
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
