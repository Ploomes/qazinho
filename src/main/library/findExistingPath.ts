import { existsSync } from 'node:fs';

export function findExistingPath(candidates: (string | undefined)[]): string | null {
  return (
    candidates.find(
      (candidate): candidate is string =>
        candidate !== undefined && candidate.length > 0 && existsSync(candidate),
    ) ?? null
  );
}
