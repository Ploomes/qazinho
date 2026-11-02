/** A porta dos agentes de fora: se o QA a ligou, e se outro programa está nela. */
export interface IOutsideServer {
  isOn: boolean;
  isBusy: boolean;
}
