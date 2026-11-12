import type { IRequestAt } from './IRequestAt';

/**
 * A rede como um momento do vídeo a mostra: os últimos pedidos, quantos começaram, os
 * erros até ali, e quantos pedidos que não são de API ficaram de fora.
 */
export interface INetworkAt {
  rows: IRequestAt[];
  shown: number;
  total: number;
  errors: number;
  earlier: number;
  others: number;
}
