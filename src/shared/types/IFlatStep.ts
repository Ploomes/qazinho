/** A plan flattened for execution: every step of every case in the order the agent walks them, each carrying its case. */
export interface IFlatStep {
  caseId: string;
  caseTitle: string;
  casePriority: string;
  caseGoal: string;
  casePreconditions: string;
  numberInCase: number;
  action: string;
  expected: string;
}
