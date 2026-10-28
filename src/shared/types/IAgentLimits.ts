/**
 * Até onde a conta do QA está dos limites: a sessão de cinco horas e a semana, cada uma
 * de 0 a 1, e quando a sessão renova, como segundo unix.
 */
export interface IAgentLimits {
  fiveHourUsed: number | null;
  sevenDayUsed: number | null;
  resetsAt: number;
}
