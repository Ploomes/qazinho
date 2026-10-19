import { describe, expect, it } from 'vitest';
import { sessionFor } from '@/modules/Chat/library';

describe('sessionFor', () => {
  it('goes on with the session the same agent started', () => {
    expect(
      sessionFor({
        workspace: { sessionId: 's-1', sessionAgentId: 'claude-code' },
        agentId: 'claude-code',
      }),
    ).toBe('s-1');
  });

  it('does NOT hand one agent the session another one started', () => {
    expect(
      sessionFor({
        workspace: { sessionId: 's-1', sessionAgentId: 'claude-code' },
        agentId: 'codex',
      }),
    ).toBeNull();
  });

  it('goes on with a session saved before QAzinho noted whose it was', () => {
    expect(
      sessionFor({
        workspace: { sessionId: 's-1', sessionAgentId: null },
        agentId: 'codex',
      }),
    ).toBe('s-1');
  });

  it('has no session to go on with in a new workspace', () => {
    expect(
      sessionFor({
        workspace: { sessionId: null, sessionAgentId: null },
        agentId: 'codex',
      }),
    ).toBeNull();
  });
});
