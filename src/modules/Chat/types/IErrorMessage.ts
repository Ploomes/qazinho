/**
 * O próprio QAzinho quebrou: o agente morreu, o dispositivo nunca subiu. Nunca um
 * resultado de teste; `runId` é a run que ele parou.
 */
export interface IErrorMessage {
  id: string;
  kind: 'error';
  runId: string | null;
  at: string;
  text: string;
  fix: string | null;
}
