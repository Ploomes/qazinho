import type { ISaveLater } from '@/shared/hooks/useArchive/types';

/** A run writes a workspace on every step; the disk only needs the last one of a burst. */
export function saveLater(settleMs: number): ISaveLater {
  const timers = new Map<string, number>();
  const pending = new Map<string, () => void>();

  return {
    save: (key, write) => {
      pending.set(key, write);
      window.clearTimeout(timers.get(key));
      timers.set(
        key,
        window.setTimeout(() => {
          timers.delete(key);
          pending.delete(key);
          write();
        }, settleMs),
      );
    },

    flush: () => {
      for (const [key, write] of pending) {
        window.clearTimeout(timers.get(key));
        write();
      }

      timers.clear();
      pending.clear();
    },
  };
}
