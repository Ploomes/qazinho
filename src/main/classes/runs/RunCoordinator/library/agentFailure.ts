import { stripAnsi } from '@/main/library';

/** An agent that errored did not test anything, so the run stops with its words instead of blocking steps. */
export function agentFailure(turn: { isError: boolean; text: string }): string | null {
  if (!turn.isError) return null;

  const said = stripAnsi(turn.text).trim();

  return said.length === 0
    ? 'The agent stopped answering, so the run stopped too.'
    : `The agent answered with an error, so the run stopped: ${said}`;
}
