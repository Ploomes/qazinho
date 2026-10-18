import type { RunFailure } from '@/shared/types';
import { stripAnsi } from '@/main/library';

/** An agent that errored did not test anything, so the run stops with its words instead of blocking steps. */
export function agentFailure(turn: {
  isError: boolean;
  text: string;
}): RunFailure | null {
  if (!turn.isError) return null;

  const said = stripAnsi(turn.text).trim();

  return said.length === 0 ? { reason: 'agent-silent' } : { reason: 'agent-error', said };
}
