/** Como o QA marcou o passo em que está num caso à mão, com a nota dele. */
export interface IManualMark {
  workspaceId: string;
  verdict: 'passed' | 'failed' | 'skipped';
  note: string;
}
