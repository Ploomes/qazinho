/** O que mudou no que o agente guarda, como uma linha do chat conta. */
export interface IMemoryChange {
  kind: 'added' | 'replaced' | 'forgotten';
  text: string;
}
