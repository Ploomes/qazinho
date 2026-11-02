import type { AppToolCall } from '@/shared/types';

/**
 * Para onde a bridge manda uma chamada, false quando nenhuma janela a pode receber, e
 * quanto tempo ela espera pela resposta.
 */
export interface IAppBridge<Call = AppToolCall> {
  send: (request: { id: string; call: Call }) => boolean;
  timeoutMs: number;
}
