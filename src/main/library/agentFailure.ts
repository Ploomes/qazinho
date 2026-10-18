import type { RunFailure } from '@/shared/types';
import { stripAnsi } from './stripAnsi';

const SIGNED_OUT =
  /not logged in|invalid api key|run \/login|\b401\b|unauthori[sz]ed|oauth token (has )?expired|authentication_error/i;

/** What an agent's failed turn means: signed out, silent, or its own words; null when the turn did not fail. */
export function agentFailure(turn: {
  isError: boolean;
  text: string;
}): RunFailure | null {
  if (!turn.isError) return null;

  const said = stripAnsi(turn.text).trim();

  if (said.length === 0) return { reason: 'agent-silent' };

  return SIGNED_OUT.test(said)
    ? { reason: 'agent-signed-out' }
    : { reason: 'agent-error', said };
}
