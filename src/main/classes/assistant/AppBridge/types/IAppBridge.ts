import type { IAppToolRequest } from '@/shared/types';

/**
 * Para onde a bridge manda uma chamada, false quando nenhuma janela a pode receber, e
 * quanto tempo ela espera pela resposta.
 */
export interface IAppBridge {
  send: (request: IAppToolRequest) => boolean;
  timeoutMs: number;
}
