/** O que o agente disse sobre um passo enquanto andava uma run, guardado com essa run. */
export interface INoteMessage {
  id: string;
  kind: 'note';
  at: string;
  runId: string;
  who: string;
  text: string;
}
