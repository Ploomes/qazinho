import { describe, expect, it } from 'vitest';
import { defaultModelOf } from '@/main/classes/agents/AgentDetector/library';

describe('defaultModelOf', () => {
  it('reads the model Claude Code is set to', () => {
    expect(defaultModelOf({ format: 'json', text: '{"model": "opus[1m]"}' })).toBe(
      'opus[1m]',
    );
  });

  it('reads the root model of a Codex config, not one inside a table', () => {
    const text = 'model = "gpt-5"\n\n[profiles.fast]\nmodel = "gpt-5-mini"\n';

    expect(defaultModelOf({ format: 'toml', text })).toBe('gpt-5');
  });

  it('does NOT take a model that only a table names', () => {
    const text = 'notify = ["x"]\n[profiles.fast]\nmodel = "gpt-5-mini"\n';

    expect(defaultModelOf({ format: 'toml', text })).toBeNull();
  });

  it('says nothing for a config with no model or one that is not readable', () => {
    expect(defaultModelOf({ format: 'json', text: '{"theme": "dark"}' })).toBeNull();
    expect(defaultModelOf({ format: 'json', text: '{ nope' })).toBeNull();
  });
});
