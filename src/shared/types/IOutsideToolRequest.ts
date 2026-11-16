import type { IOutsideCall } from './IOutsideCall';

/**
 * A chamada de um agente de fora que a main entrega à página para executar, e o id com
 * que a resposta volta.
 */
export interface IOutsideToolRequest {
  id: string;
  call: IOutsideCall;
}
