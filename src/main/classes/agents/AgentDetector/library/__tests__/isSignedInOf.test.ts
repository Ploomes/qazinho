import { describe, expect, it } from 'vitest';
import { isSignedInOf } from '@/main/classes/agents/AgentDetector/library';

describe('isSignedInOf', () => {
  it('reads Claude Code signed in, and signed out, from its JSON', () => {
    expect(
      isSignedInOf({
        reads: 'claude',
        code: 0,
        printed: '{"loggedIn": true, "authMethod": "claude.ai"}',
      }),
    ).toBe(true);
    expect(
      isSignedInOf({ reads: 'claude', code: 1, printed: '{"loggedIn": false}' }),
    ).toBe(false);
  });

  it('reads Codex signed out from the line it prints, whatever the exit code', () => {
    expect(isSignedInOf({ reads: 'codex', code: 1, printed: 'Not logged in\n' })).toBe(
      false,
    );
  });

  it('reads Codex signed in from a clean exit that says so', () => {
    expect(
      isSignedInOf({ reads: 'codex', code: 0, printed: 'Logged in using ChatGPT\n' }),
    ).toBe(true);
  });

  /** An agent that answered something else must not be called signed out: it may be fine. */
  it('says it cannot tell when the answer is not one it knows', () => {
    expect(
      isSignedInOf({ reads: 'claude', code: 1, printed: 'error: unknown command auth' }),
    ).toBeNull();
    expect(
      isSignedInOf({
        reads: 'codex',
        code: 2,
        printed: 'error: unrecognized subcommand',
      }),
    ).toBeNull();
  });
});
