/**
 * Por que uma run ou um turno de chat parou no meio, para a página dizer no idioma do QA;
 * `said` guarda as próprias palavras da máquina.
 */
export type RunFailure =
  | { reason: 'agent-missing'; agentId: string }
  | { reason: 'no-emulator' }
  | { reason: 'no-simulator' }
  | { reason: 'unreachable'; url: string; code: string }
  | { reason: 'agent-signed-out' }
  | { reason: 'agent-error'; said: string }
  | { reason: 'agent-silent' }
  | { reason: 'other'; said: string; detail?: string | null };
