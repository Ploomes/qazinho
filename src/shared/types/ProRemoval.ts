/**
 * Um projeto apagado na org e desligado aqui, ou por que a org o manteve: um job de CI
 * rodando, um papel que não pode, sem resposta, máquina deslogada ou recusa.
 */
export type ProRemoval =
  | { isRemoved: true }
  | {
      isRemoved: false;
      failure: 'busy' | 'forbidden' | 'unreachable' | 'signed-out' | 'failed';
    };
