/**
 * Why a run or a chat turn stopped short, for the page to say in the QA's language;
 * `said` keeps the machine's own words.
 */
export type RunFailure =
  | { reason: 'agent-missing'; agentId: string }
  | { reason: 'no-emulator' }
  | { reason: 'no-simulator' }
  | { reason: 'unreachable'; url: string; code: string }
  | { reason: 'agent-signed-out' }
  | { reason: 'agent-error'; said: string }
  | { reason: 'agent-silent' }
  | { reason: 'other'; said: string };
