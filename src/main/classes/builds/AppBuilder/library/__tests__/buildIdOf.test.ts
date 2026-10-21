import { describe, expect, it } from 'vitest';
import { buildIdOf } from '@/main/classes/builds/AppBuilder/library';

describe('buildIdOf', () => {
  it('reads the build out of the scope its agent ran under', () => {
    expect(buildIdOf('~build:b-42')).toBe('b-42');
  });

  it('does NOT take a workspace, the assistant, or a scope with no build', () => {
    expect(buildIdOf('w-1')).toBeNull();
    expect(buildIdOf('~assistant')).toBeNull();
    expect(buildIdOf('~build:')).toBeNull();
  });
});
