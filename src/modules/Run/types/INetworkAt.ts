import type { IRequestAt } from './IRequestAt';

/**
 * A rede como um momento do vídeo a mostra: os últimos pedidos, quantos começaram de
 * quantos a run fez, os erros até ali, e os arquivos de fora.
 */
export interface INetworkAt {
  rows: IRequestAt[];
  shown: number;
  total: number;
  errors: number;
  earlier: number;
  files: number;
}
