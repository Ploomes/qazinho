/**
 * Como a run anda o caso: o agente grava, a gravação anda, o agente a ajusta, o caso à
 * mão é preparado, o agente entra na conta do caso, ou o QA o anda.
 */
export type RunHow = 'develop' | 'replay' | 'adjust' | 'prepare' | 'signIn' | 'manual';
