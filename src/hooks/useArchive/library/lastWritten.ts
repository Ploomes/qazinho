import type { ILastWritten } from '@/hooks/useArchive/types';

/** What disk already holds. A load that lands twice must not write itself back over the QA. */
export function lastWritten(): ILastWritten {
  const held = new Map<string, string>();

  return {
    isNew: (key, text) => held.get(key) !== text,
    keep: (key, text) => {
      held.set(key, text);
    },
    forget: (key) => {
      held.delete(key);
    },
  };
}
