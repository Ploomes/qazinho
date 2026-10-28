import { NETWORK } from '@/modules/Run/constants';

/**
 * Quanto da barra um pedido enche pelo tempo que levou, uma década por vez, para um lento
 * se destacar e um rápido ainda aparecer.
 */
export function requestBarOf(ms: number): number {
  const share = Math.log10(1 + Math.max(0, ms)) / NETWORK.barDecades;

  return Math.min(1, Math.max(NETWORK.barFloor, share));
}
