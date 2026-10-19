import { describe, expect, it } from 'vitest';
import { isLostSession } from '@/main/library';

describe('isLostSession', () => {
  it('reads Claude Code refusing a session it no longer has', () => {
    expect(
      isLostSession(
        'No conversation found with session ID: 00000000-0000-0000-0000-000000000000',
      ),
    ).toBe(true);
  });

  it('reads a thread another agent cannot find', () => {
    expect(isLostSession('Error: thread 0199 not found')).toBe(true);
  });

  it('does NOT take any failure for a lost session', () => {
    expect(isLostSession('Invalid API key · Please run /login')).toBe(false);
    expect(isLostSession('')).toBe(false);
  });
});
