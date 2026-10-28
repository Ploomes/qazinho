import type { IAgentLine } from '@/main/types';

/**
 * A CLI escreve um objeto JSON por linha; uma linha escrita pela metade não é um erro, só
 * não é nossa.
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
