import type { ICodexLine } from '@/main/types';
import { describe, expect, it } from 'vitest';
import { hearCodex } from '@/main/classes/agents/AgentRunner/library';

const hear = (line: ICodexLine) => hearCodex({ line, usage: null });

describe('hearCodex', () => {
  it('takes the session from the thread Codex started', () => {
    expect(hear({ type: 'thread.started', thread_id: '01a1-thread' })).toEqual({
      sessionId: '01a1-thread',
    });
  });

  it('takes a command Codex sets out to run, on one line', () => {
    expect(
      hear({
        type: 'item.started',
        item: {
          type: 'command_execution',
          command: "bash -lc './gradlew assembleDebug'\n",
        },
      }),
    ).toEqual({ action: "$ bash -lc './gradlew assembleDebug'" });
  });

  it('takes what the agent said', () => {
    expect(
      hear({ type: 'item.completed', item: { type: 'agent_message', text: ' Done. ' } }),
    ).toEqual({
      message: 'Done.',
    });
  });

  it('ends the turn with the tokens it carried', () => {
    expect(
      hear({
        type: 'turn.completed',
        usage: { input_tokens: 1200, cached_input_tokens: 800, output_tokens: 40 },
      }),
    ).toMatchObject({ usage: { contextTokens: 1200 }, ended: { isError: false } });
  });

  /** These four lines are what a signed-out Codex printed on a real machine. */
  it('reads a signed-out Codex as an error the QA can fix, and the retries in between as nothing', () => {
    expect(
      hear({
        type: 'error',
        message: 'Reconnecting... 2/5 (unexpected status 401 Unauthorized)',
      }),
    ).toEqual({});
    expect(
      hear({
        type: 'item.completed',
        item: { type: 'error', message: 'Falling back from WebSockets' },
      }),
    ).toEqual({});
    expect(
      hear({
        type: 'turn.failed',
        error: {
          message:
            'unexpected status 401 Unauthorized: Missing bearer or basic authentication in header',
        },
      }),
    ).toEqual({
      ended: {
        isError: true,
        text: 'unexpected status 401 Unauthorized: Missing bearer or basic authentication in header',
      },
    });
  });

  it('passes any other failure through as Codex said it', () => {
    expect(
      hear({ type: 'turn.failed', error: { message: 'model not found' } }).ended?.text,
    ).toBe('model not found');
  });
});
