// @vitest-environment jsdom
import type { IMcpSignInProps } from '@/modules/Setup/components/McpCard/components/McpSignIn/types';
import type { McpSignInPhase, McpSignInStep } from '@/shared/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

const keysOf = (actions: { key: string }[]) => actions.map(({ key }) => key);

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
      expect(result.current).toMatchObject({
        tone: 'working',
        title: 'Connecting Figma to Claude Code',
      });
    });

    it('checks every step once connected', () => {
      const { result } = signingIn({ phase: 'connected' });

      expect(result.current.rows.every(({ state }) => state === 'done')).toBe(true);
      expect(result.current).toMatchObject({
        tone: 'connected',
        title: 'Figma is connected',
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
        tone: 'failed',
        title: 'Figma is not connected',
        subtitle: 'Claude Code did not get to the Figma sign-in.',
        detail: null,
      });
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
      expect(result.current.page).toEqual({
        url: 'https://www.figma.com/oauth/mcp',
        label: 'Open the page again ↗',
      });
    });

    it('waits for the page before pointing at the browser', () => {
      const { result } = signingIn({ phase: 'working', at: 'browser', url: null });

      expect(result.current).toMatchObject({ hint: null, page: null });
    });

    it('points at Terminal on the way round', () => {
      const { result } = signingIn({ phase: 'working', at: 'terminal', url: null }, [
        'check',
        'terminal',
      ]);

      expect(result.current.hint).toContain('In Terminal, pick Figma');
    });

    it("shows the agent's own words when it refused", () => {
      const { result } = signingIn({
        phase: 'failed',
        at: 'browser',
        failure: 'refused',
        said: 'figma rejected them on reconnect',
        canUseTerminal: false,
      });

      expect(result.current.detail).toEqual({
        text: 'figma rejected them on reconnect',
        isCommand: false,
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

      expect(result.current.detail).toEqual({ text: 'claude /mcp', isCommand: true });
      expect(keysOf(result.current.actions)).toEqual(['close']);
    });
  });

  describe('the buttons', () => {
    it('only cancels while working', () => {
      const { result, props } = signingIn({ phase: 'working', at: 'open', url: null });

      expect(keysOf(result.current.actions)).toEqual(['cancel']);
      result.current.actions[0]?.onClick();
      expect(props.onCancel).toHaveBeenCalledTimes(1);
    });

    it('closes once connected', () => {
      const { result } = signingIn({ phase: 'connected' });

      expect(keysOf(result.current.actions)).toEqual(['done']);
    });

    it('offers Terminal and another try after a failure it can come back from', () => {
      const { result, props } = signingIn({
        phase: 'failed',
        at: 'open',
        failure: 'closed',
        said: '',
        canUseTerminal: true,
      });

      expect(keysOf(result.current.actions)).toEqual(['close', 'terminal', 'retry']);
      result.current.actions[1]?.onClick();
      result.current.actions[2]?.onClick();
      expect(props.onUseTerminal).toHaveBeenCalledTimes(1);
      expect(props.onRetry).toHaveBeenCalledTimes(1);
    });
  });
});
