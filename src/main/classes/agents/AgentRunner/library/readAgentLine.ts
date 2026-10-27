import type { IAgentLine } from '@/main/types';

/**
 * The CLI writes one JSON object per line; a half-written line is not an error, just not
 * ours.
 */
export function readAgentLine(line: string): IAgentLine | null {
  const trimmed = line.trim();

  if (trimmed.length === 0 || !trimmed.startsWith('{')) return null;

  try {
    return JSON.parse(trimmed) as IAgentLine;
  } catch {
    return null;
  }
}
