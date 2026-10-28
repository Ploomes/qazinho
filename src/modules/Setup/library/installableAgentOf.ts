import type { InstallableId } from '@/shared/types';

const AGENTS: InstallableId[] = ['claude-code', 'codex'];

/**
 * A instalação por trás de um agente detectado, ou null para um agente que o QAzinho não
 * consegue instalar.
 */
export function installableAgentOf(agentId: string): InstallableId | null {
  return AGENTS.find((id) => id === agentId) ?? null;
}
