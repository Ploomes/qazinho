import type { RequestOutcome } from './RequestOutcome';

/**
 * Um pedido posto no vídeo de uma run: onde começa e termina lá, com o endereço dividido
 * em outro host e o caminho; `toMs` é null para um que nunca terminou.
 */
export interface IReplayRequest {
  id: number;
  method: string;
  url: string;
  host: string | null;
  path: string;
  type: string;
  isFile: boolean;
  outcome: RequestOutcome;
  status: number | null;
  failure: string | null;
  fromMs: number;
  toMs: number | null;
  durationMs: number | null;
  size: number | null;
}
