import type { StateStorage } from 'zustand/middleware';

/** Reads a preference from the key it had before the rename when the new key holds nothing yet. */
export function withLegacyKeys(props: {
  storage: StateStorage;
  legacy: Record<string, string>;
}): StateStorage {
  const { storage, legacy } = props;

  return {
    getItem: (name) => {
      const value = storage.getItem(name);
      const old = legacy[name];

      if (value !== null || old === undefined) return value;

      return storage.getItem(old);
    },
    setItem: (name, value) => storage.setItem(name, value),
    removeItem: (name) => storage.removeItem(name),
  };
}
