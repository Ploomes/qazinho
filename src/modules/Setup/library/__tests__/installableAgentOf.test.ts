import { describe, expect, it } from 'vitest';
import { installableAgentOf } from '@/modules/Setup/library';

describe('installableAgentOf', () => {
  it('knows how to install each agent QAzinho drives', () => {
    expect(installableAgentOf('claude-code')).toBe('claude-code');
    expect(installableAgentOf('codex')).toBe('codex');
  });

  it('does NOT offer to install something that is not an agent', () => {
    expect(installableAgentOf('axe')).toBeNull();
    expect(installableAgentOf('gemini-cli')).toBeNull();
  });
});
