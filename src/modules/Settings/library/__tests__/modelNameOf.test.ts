import { describe, expect, it } from 'vitest';
import { MODELS } from '@/modules/Settings/constants';
import { modelNameOf } from '@/modules/Settings/library';

const CLAUDE = MODELS['Claude Code'] ?? [];

describe('modelNameOf', () => {
  it('names a picked model the way the menu does', () => {
    expect(modelNameOf({ model: 'opus', defaultModel: null, models: CLAUDE })).toBe(
      'Opus',
    );
  });

  it('names the default by what the agent own config sets', () => {
    expect(modelNameOf({ model: '', defaultModel: 'opus[1m]', models: CLAUDE })).toBe(
      'opus[1m]',
    );
  });

  it('does NOT invent a name when the agent config names no model', () => {
    expect(modelNameOf({ model: '', defaultModel: null, models: CLAUDE })).toBeNull();
  });

  it('shows an id the menu does not list as it is', () => {
    expect(modelNameOf({ model: 'claude-x', defaultModel: null, models: CLAUDE })).toBe(
      'claude-x',
    );
  });
});
