/**
 * Uma senha ou um token escrito no plano, como aparece lá, e o primeiro caso que o
 * escreve.
 */
export interface IWrittenSecret {
  value: string;
  kind: 'password' | 'token';
  caseId: string;
}
