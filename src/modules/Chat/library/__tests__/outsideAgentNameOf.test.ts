import { describe, expect, it } from 'vitest';
import { outsideAgentNameOf } from '@/modules/Chat/library';

describe('outsideAgentNameOf', () => {
  it('names Claude Code and Codex, and no other agent', () => {
    expect(outsideAgentNameOf('claude-code')).toBe('Claude Code');
    expect(outsideAgentNameOf('codex')).toBe('Codex');
    expect(outsideAgentNameOf('other')).toBeNull();
    expect(outsideAgentNameOf(undefined)).toBeNull();
  });
});
