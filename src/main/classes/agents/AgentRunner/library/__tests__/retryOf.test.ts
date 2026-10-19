import { describe, expect, it } from 'vitest';
import { retryOf } from '@/main/classes/agents/AgentRunner/library';

describe('retryOf', () => {
  it('reads the try Claude Code is on when its service does not answer', () => {
    expect(
      retryOf({
        type: 'system',
        subtype: 'api_retry',
        attempt: 3,
        max_retries: 10,
        session_id: 's1',
      }),
    ).toEqual({ attempt: 3, maxRetries: 10 });
  });

  it('does NOT read any other line as a retry', () => {
    expect(retryOf({ type: 'system', subtype: 'init' })).toBeNull();
    expect(retryOf({ type: 'result', result: 'ok' })).toBeNull();
  });

  it('counts up to the try it is on when the line does not say how many there are', () => {
    expect(retryOf({ type: 'system', subtype: 'api_retry', attempt: 2 })).toEqual({
      attempt: 2,
      maxRetries: 2,
    });
  });
});
