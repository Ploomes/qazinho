import type { InstallableId } from '@/types';

const AGENTS: InstallableId[] = ['claude-code', 'codex', 'gemini-cli'];

/** The install behind a detected agent, or null for an agent gocrash cannot install. */
export function installableAgentOf(agentId: string): InstallableId | null {
  return AGENTS.find((id) => id === agentId) ?? null;
}
