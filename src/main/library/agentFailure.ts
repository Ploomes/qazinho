import type { RunFailure } from '@/shared/types';
import { stripAnsi } from './stripAnsi';

const SIGNED_OUT =
  /not logged in|invalid api key|run \/login|\b401\b|unauthori[sz]ed|oauth token (has )?expired|authentication_error/i;

/**
 * O que significa o turno de um agente que falhou: deslogado, calado, ou as próprias
 * palavras dele; null quando o turno não falhou.
 */
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
