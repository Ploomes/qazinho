/**
 * O relógio que termina um turno de agente que demora demais: armado enquanto roda, com o
 * tempo que lhe resta desde a última vez que começou.
 */
export interface IAgentClock {
  timer: NodeJS.Timeout | null;
  leftMs: number;
  since: number;
}
