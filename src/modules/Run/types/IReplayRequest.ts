import type { RequestOutcome } from './RequestOutcome';

/**
 * Um pedido posto no vídeo de uma run, o endereço em host e caminho; `toMs` null nunca
 * terminou, e `body` é o começo da resposta de uma chamada que falhou.
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
  body: string | null;
}
