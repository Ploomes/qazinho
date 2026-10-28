import type { AppToolCall } from './AppToolCall';

/**
 * Uma chamada de ferramenta do app que a main entrega à página para executar, e o id com
 * que a resposta volta.
 */
export interface IAppToolRequest {
  id: string;
  call: AppToolCall;
}
