/**
 * Como um login chega ao agente: as telas dele dirigidas fora de vista, o fluxo de
 * navegador dele, ou o Terminal para o QA terminar.
 */
export type McpSignInRoute = 'hidden' | 'browser' | 'terminal';
