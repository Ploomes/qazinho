/** O cartão que entrega o plano à aba Plano; o plano em si nunca cai no chat. */
export interface IPlanMessage {
  id: string;
  kind: 'plan';
  at: string;
  caseCount: number;
  stepCount: number;
}
