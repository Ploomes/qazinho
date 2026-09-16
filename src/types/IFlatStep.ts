/** A plan flattened for execution: every step of every case, in the order the agent walks them. */
export interface IFlatStep {
  caseId: string;
  caseTitle: string;
  numberInCase: number;
  action: string;
  expected: string;
}
