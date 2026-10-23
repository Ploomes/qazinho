/** A password or a token written out in the plan, as it reads there, and the first case that writes it. */
export interface IWrittenSecret {
  value: string;
  kind: 'password' | 'token';
  caseId: string;
}
