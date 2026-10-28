import type { AssistantMessage } from '@/modules/Assistant/types';
import { describe, expect, it } from 'vitest';
import { ASSISTANT_KEPT } from '@/modules/Assistant/constants';
import { keptOf } from '@/store/AssistantStore/library';

const ASKED: AssistantMessage = { kind: 'user', id: 'm-1', text: 'Apaga o Login' };

describe('keptOf', () => {
  it('keeps the chat and the session to go on in', () => {
    expect(
      keptOf({ messages: [ASKED], sessionId: 's-1', sessionAgentId: 'claude-code' }),
    ).toEqual({ messages: [ASKED], sessionId: 's-1', sessionAgentId: 'claude-code' });
  });

  /**
   * O QAzinho fechando no meio de um turno traria de volta um cartão que ninguém pode
   * responder.
   */
  it('does NOT keep anything going: a tool reads failed, and an open card ran out', () => {
    const { messages } = keptOf({
      messages: [
        ASKED,
        {
          kind: 'tool',
          id: 'c-1',
          call: { name: 'go_home', args: {} },
          subject: '',
          state: 'doing',
        },
        {
          kind: 'confirm',
          id: 'c-2',
          action: 'delete_workspace',
          subject: 'Login',
          count: 0,
          decision: null,
        },
      ],
      sessionId: null,
      sessionAgentId: null,
    });

    expect(messages[1]).toMatchObject({ state: 'failed' });
    expect(messages[2]).toMatchObject({ decision: 'expired' });
  });

  it('keeps only the latest messages of a long chat', () => {
    const many: AssistantMessage[] = Array.from(
      { length: ASSISTANT_KEPT + 5 },
      (_, index) => ({
        kind: 'user',
        id: `m-${String(index)}`,
        text: String(index),
      }),
    );
    const { messages } = keptOf({
      messages: many,
      sessionId: null,
      sessionAgentId: null,
    });

    expect(messages).toHaveLength(ASSISTANT_KEPT);
    expect(messages[0]?.id).toBe('m-5');
  });
});
