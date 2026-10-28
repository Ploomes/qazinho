/**
 * Como uma run vai: casos com receita andados de novo sem o agente, todo caso com o
 * agente, ou o app explorado pelo agente sem plano.
 */
export type RunMode = 'replay' | 'agent' | 'explore';
