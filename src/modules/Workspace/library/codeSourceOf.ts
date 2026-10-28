import type { ICodeSource } from '@/shared/types';

/**
 * O código que um plano salvo nomeia como de onde veio, ou null quando não nomeia nenhum
 * ou o arquivo foi editado até virar bobagem.
 */
export function codeSourceOf(saved: unknown): ICodeSource | null {
  if (typeof saved !== 'object' || saved === null) return null;

  const { repository, branch, base, commit } = saved as Record<string, unknown>;

  return typeof repository === 'string' &&
    typeof branch === 'string' &&
    typeof base === 'string' &&
    typeof commit === 'string'
    ? { repository, branch, base, commit }
    : null;
}
