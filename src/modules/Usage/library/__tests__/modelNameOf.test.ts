import { describe, expect, it } from 'vitest';
import { modelNameOf } from '@/modules/Usage/library';

describe('modelNameOf', () => {
  it('names a Claude model by its family and version', () => {
    expect(modelNameOf('claude-sonnet-5-5')).toBe('Sonnet 5.5');
    expect(modelNameOf('claude-haiku-4-5-20251001')).toBe('Haiku 4.5');
    expect(modelNameOf('claude-opus-4-20250514')).toBe('Opus 4');
  });

  it('keeps any other model as it came, and has no name for the default', () => {
    expect(modelNameOf('gpt-5.5-codex')).toBe('gpt-5.5-codex');
    expect(modelNameOf('sonnet')).toBe('sonnet');
    expect(modelNameOf('')).toBeNull();
  });
});
