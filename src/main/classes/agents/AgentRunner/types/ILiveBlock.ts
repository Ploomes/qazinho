/** O bloco que a CLI está escrevendo agora, montado pelos pedaços que chegaram. */
export interface ILiveBlock {
  kind: 'text' | 'answer';
  written: string;
}
