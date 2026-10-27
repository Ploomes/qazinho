import type { ICodeSource } from '@/shared/types';

/**
 * The code a saved plan names as where it came from, or null when it names none or the
 * file was edited into nonsense.
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
