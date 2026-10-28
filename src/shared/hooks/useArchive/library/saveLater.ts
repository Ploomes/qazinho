import type { ISaveLater } from '@/shared/hooks/useArchive/types';

/**
 * Uma run escreve um workspace a cada passo; o disco só precisa do último de uma rajada.
 */
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

    drop: (key) => {
      window.clearTimeout(timers.get(key));
      timers.delete(key);
      pending.delete(key);
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
