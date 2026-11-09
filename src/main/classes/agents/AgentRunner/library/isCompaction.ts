import type { IAgentLine } from '@/main/types';

/** Se a CLI resumiu a conversa aqui, e o agente pode ter perdido o que tinha lido. */
export function isCompaction(line: IAgentLine): boolean {
  return line.type === 'system' && line.subtype === 'compact_boundary';
}
