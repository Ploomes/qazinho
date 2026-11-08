import { LIVE_STREAM } from '@/main/classes/devices/LiveStream/constants';

/** Se um pedido quer só a imagem de agora de uma transmissão, e não a transmissão. */
export function isStillPath(path: string): boolean {
  return new URLSearchParams(path.split('?')[1] ?? '').has(LIVE_STREAM.stillParam);
}
