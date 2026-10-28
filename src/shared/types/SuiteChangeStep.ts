/**
 * O que uma mudança numa suíte está fazendo enquanto trabalha: fazendo a cópia, o agente
 * trabalhando, ou o QAzinho rodando o teste de novo.
 */
export type SuiteChangeStep = 'copy' | 'agent' | 'check';
