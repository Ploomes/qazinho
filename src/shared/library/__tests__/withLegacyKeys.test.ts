import type { StateStorage } from 'zustand/middleware';
import { describe, expect, it } from 'vitest';
import { withLegacyKeys } from '@/shared/library';

function memory(saved: Record<string, string>): StateStorage {
  return {
    getItem: (name) => saved[name] ?? null,
    setItem: (name, value) => {
      saved[name] = value;
    },
    removeItem: (name) => {
      Reflect.deleteProperty(saved, name);
    },
  };
}

const LEGACY = { 'qazinho.settings': 'gocrash.settings' };

describe('withLegacyKeys', () => {
  it('reads the preferences saved before the rename while the new key is empty', () => {
    const storage = withLegacyKeys({
      storage: memory({ 'gocrash.settings': '{"agent":"Codex"}' }),
      legacy: LEGACY,
    });

    expect(storage.getItem('qazinho.settings')).toBe('{"agent":"Codex"}');
  });

  it('prefers what was saved under the new key', () => {
    const storage = withLegacyKeys({
      storage: memory({ 'gocrash.settings': 'old', 'qazinho.settings': 'new' }),
      legacy: LEGACY,
    });

    expect(storage.getItem('qazinho.settings')).toBe('new');
  });

  it('writes under the new key only', () => {
    const saved: Record<string, string> = {};
    const storage = withLegacyKeys({ storage: memory(saved), legacy: LEGACY });

    void storage.setItem('qazinho.settings', 'x');

    expect(saved).toEqual({ 'qazinho.settings': 'x' });
  });

  it('has nothing for a key that never had an old name', () => {
    const storage = withLegacyKeys({ storage: memory({}), legacy: LEGACY });

    expect(storage.getItem('qazinho.other')).toBeNull();
  });
});
