import type { ILastWritten } from '@/shared/hooks/useArchive/types';

/**
 * O que o disco já guarda. Uma carga que chega duas vezes não pode se escrever de volta
 * por cima do QA.
 */
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
