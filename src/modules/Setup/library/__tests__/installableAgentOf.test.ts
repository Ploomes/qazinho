import { describe, expect, it } from 'vitest';
import { installableAgentOf } from '@/modules/Setup/library';

describe('installableAgentOf', () => {
  it('knows how to install each agent QAzinho drives', () => {
    expect(installableAgentOf('claude-code')).toBe('claude-code');
    expect(installableAgentOf('codex')).toBe('codex');
    expect(installableAgentOf('gemini-cli')).toBe('gemini-cli');
  });

  it('does NOT offer to install something that is not an agent', () => {
    expect(installableAgentOf('idb')).toBeNull();
    expect(installableAgentOf('aider')).toBeNull();
  });
});
