import { describe, expect, it } from 'vitest';
import { changeIdOf } from '@/main/classes/automation/SuiteChanges/library';

describe('changeIdOf', () => {
  it("reads the change out of its agent's scope", () => {
    expect(changeIdOf('~change:c-01')).toBe('c-01');
  });

  it("knows a workspace's, a build's or the assistant's scope is no change's", () => {
    expect(changeIdOf('w-1')).toBeNull();
    expect(changeIdOf('~build:b-1')).toBeNull();
    expect(changeIdOf('~assistant')).toBeNull();
    expect(changeIdOf('~change:')).toBeNull();
  });
});
