/**
 * Uma run que terminou, ou cujo agente pergunta algo ao QA, dita no idioma dele, para a
 * main o chamar de volta enquanto ele está longe.
 */
export interface IRunAlert {
  workspaceId: string;
  runId: string;
  title: string;
  body: string;
}
