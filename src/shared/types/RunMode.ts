/**
 * Como uma run vai: casos com receita andados de novo sem o agente, todo caso com o
 * agente, o app explorado sem plano, ou um caso andado pelo QA à mão.
 */
export type RunMode = 'replay' | 'agent' | 'explore' | 'manual';
