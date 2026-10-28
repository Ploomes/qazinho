/**
 * Onde um build está: pegando o código do GitHub, o agente o construindo, ou o QAzinho
 * conferindo o que ele fez.
 */
export type BuildStep = 'code' | 'agent' | 'artifact';
