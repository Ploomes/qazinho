import { describe, expect, it } from 'vitest';
import { ASSISTANT_WAIT } from '@/shared/constants';

describe('ASSISTANT_WAIT', () => {
  /** An agent gives up on a tool that outlives its timeout, and the QA's answer would land on nobody. */
  it('lets a tool call outlast the QA confirming on screen', () => {
    expect(ASSISTANT_WAIT.toolMs).toBeGreaterThan(ASSISTANT_WAIT.confirmMs);
  });

  /** Claude Code drops a quiet HTTP tool after five minutes unless the server says how long it may take. */
  it('waits on the QA for no less than a minute', () => {
    expect(ASSISTANT_WAIT.confirmMs).toBeGreaterThanOrEqual(60_000);
  });
});
