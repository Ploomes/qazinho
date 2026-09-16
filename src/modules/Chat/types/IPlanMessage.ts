/** The card that hands the plan over to the Plan tab; the plan itself never lands in the chat. */
export interface IPlanMessage {
  id: string;
  kind: 'plan';
  at: string;
  caseCount: number;
  stepCount: number;
}
