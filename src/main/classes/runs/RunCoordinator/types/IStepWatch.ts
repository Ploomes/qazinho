/** Quanto o agente já fez no passo de agora, e há quanto tempo o QA não sabe dele. */
export interface IStepWatch {
  actions: number;
  sinceSay: number;
  askedAt: number;
}
