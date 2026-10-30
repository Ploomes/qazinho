/**
 * Por que o login de um agente parou no meio: um agente sem login conhecido, nenhum
 * terminal para abrir, ou tempo demais; o popup põe cada um em palavras.
 */
export type AgentSignInFailure = 'unsupported' | 'terminal' | 'timeout';
