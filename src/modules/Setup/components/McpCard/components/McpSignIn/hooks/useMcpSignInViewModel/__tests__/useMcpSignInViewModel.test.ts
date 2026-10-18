// @vitest-environment jsdom
import type { IMcpSignInProps } from '@/modules/Setup/components/McpCard/components/McpSignIn/types';
import type { McpSignInPhase, McpSignInStep } from '@/shared/types';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MCP_SIGN_IN } from '@/modules/Setup/components/McpCard/components/McpSignIn/constants';
import { useMcpSignInViewModel } from '@/modules/Setup/components/McpCard/components/McpSignIn/hooks/useMcpSignInViewModel';
import { MCP_SERVERS } from '@/modules/Setup/constants';

const HIDDEN: McpSignInStep[] = ['check', 'add', 'open', 'authorize', 'browser'];

function signingIn(phase: McpSignInPhase, steps = HIDDEN) {
  const props: IMcpSignInProps = {
    server: MCP_SERVERS[0]!,
    agent: 'Claude Code',
    progress: { target: { id: 'figma', agentId: 'claude-code' }, steps, ...phase },
    onCancel: vi.fn(),
    onClose: vi.fn(),
    onRetry: vi.fn(),
    onUseTerminal: vi.fn(),
  };

  return { props, ...renderHook(() => useMcpSignInViewModel(props)) };
}

function press(key: string) {
  act(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key }));
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('useMcpSignInViewModel', () => {
  describe('the steps', () => {
    it('marks what is done, what runs now and what is still to come', () => {
      const { result } = signingIn({ phase: 'working', at: 'open', url: null });

      expect(result.current.rows.map(({ state }) => state)).toEqual([
        'done',
        'done',
        'active',
        'pending',
        'pending',
      ]);
      expect(result.current.rows.map(({ label }) => label)).toEqual([
        'Look for Figma in Claude Code',
        'Add Figma to Claude Code',
        'Open Claude Code in the background',
        'Ask Figma for access',
        'Allow access in your browser',
      ]);
      expect(result.current.title).toBe('Connecting Figma to Claude Code');
    });

    it('checks every step once connected', () => {
      const { result } = signingIn({ phase: 'connected' });

      expect(result.current.rows.every(({ state }) => state === 'done')).toBe(true);
      expect(result.current).toMatchObject({
        title: 'Figma is connected',
        tone: 'connected',
        badgeMark: '✓',
      });
    });

    it('crosses out the step that stopped, and says why in the subtitle', () => {
      const { result } = signingIn({
        phase: 'failed',
        at: 'authorize',
        failure: 'screen',
        said: '',
        canUseTerminal: true,
      });

      expect(result.current.rows.map(({ state }) => state)).toEqual([
        'done',
        'done',
        'done',
        'failed',
        'pending',
      ]);
      expect(result.current).toMatchObject({
        title: 'Figma is not connected',
        subtitle: 'Claude Code did not get to the Figma sign-in.',
        canRetry: true,
        canUseTerminal: true,
        detail: null,
      });
    });

    it('staggers the steps that arrive together, up to a ceiling', () => {
      const { result } = signingIn({ phase: 'working', at: 'check', url: null });

      expect(result.current.rows.map(({ delay }) => delay)[1]).toBeGreaterThan(0);
      expect(
        Math.max(...result.current.rows.map(({ delay }) => delay)),
      ).toBeLessThanOrEqual(0.36);
    });
  });

  describe('what the QA does next', () => {
    it('points at the browser, with the page to open again', () => {
      const { result } = signingIn({
        phase: 'working',
        at: 'browser',
        url: 'https://www.figma.com/oauth/mcp',
      });

      expect(result.current.hint).toContain('A Figma page opened in your browser');
      expect(result.current.pageUrl).toBe('https://www.figma.com/oauth/mcp');
    });

    it('points at Terminal on the way round, with no page to open', () => {
      const { result } = signingIn({ phase: 'working', at: 'terminal', url: null }, [
        'check',
        'terminal',
      ]);

      expect(result.current.hint).toContain('In Terminal, pick Figma');
      expect(result.current.pageUrl).toBeNull();
    });

    it('waits for the page before pointing at the browser', () => {
      expect(
        signingIn({ phase: 'working', at: 'browser', url: null }).result.current.hint,
      ).toBeNull();
    });

    it('says nothing while QAzinho does the work', () => {
      expect(
        signingIn({ phase: 'working', at: 'add', url: null }).result.current.hint,
      ).toBeNull();
    });

    it("shows the agent's own words when it refused", () => {
      const { result } = signingIn({
        phase: 'failed',
        at: 'browser',
        failure: 'refused',
        said: 'figma rejected them on reconnect',
        canUseTerminal: false,
      });

      expect(result.current).toMatchObject({
        detail: 'figma rejected them on reconnect',
        detailClass: 'mcp-sign-in__detail',
        canUseTerminal: false,
      });
    });

    it('gives the command to run by hand, and does NOT offer to try again', () => {
      const { result } = signingIn(
        {
          phase: 'failed',
          at: 'terminal',
          failure: 'manual',
          said: 'claude /mcp',
          canUseTerminal: false,
        },
        ['check', 'terminal'],
      );

      expect(result.current).toMatchObject({
        detail: 'claude /mcp',
        detailClass: 'mcp-sign-in__detail mcp-sign-in__detail--command',
        canRetry: false,
      });
    });
  });

  describe('closing', () => {
    it('cancels on Escape while working, and closes on Escape after', () => {
      const working = signingIn({ phase: 'working', at: 'open', url: null });

      press('Escape');

      expect(working.props.onCancel).toHaveBeenCalledTimes(1);
      working.unmount();

      const failed = signingIn({
        phase: 'failed',
        at: 'open',
        failure: 'closed',
        said: '',
        canUseTerminal: true,
      });

      press('Escape');

      expect(failed.props.onClose).toHaveBeenCalledTimes(1);
      expect(failed.props.onCancel).not.toHaveBeenCalled();
    });

    it('does NOT close on a click outside while working', () => {
      const { result, props } = signingIn({ phase: 'working', at: 'browser', url: null });

      result.current.onBackdrop();

      expect(props.onClose).not.toHaveBeenCalled();
    });

    it('closes on a click outside once it ended', () => {
      const { result, props } = signingIn({ phase: 'connected' });

      result.current.onBackdrop();

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('closes on its own a moment after connecting', () => {
      vi.useFakeTimers();

      const { props } = signingIn({ phase: 'connected' });

      act(() => {
        vi.advanceTimersByTime(MCP_SIGN_IN.closeAfterMs - 1);
      });

      expect(props.onClose).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(props.onClose).toHaveBeenCalledTimes(1);
    });

    it('does NOT close on its own while working', () => {
      vi.useFakeTimers();

      const { props } = signingIn({ phase: 'working', at: 'browser', url: null });

      act(() => {
        vi.advanceTimersByTime(MCP_SIGN_IN.closeAfterMs * 10);
      });

      expect(props.onClose).not.toHaveBeenCalled();
    });
  });
});
