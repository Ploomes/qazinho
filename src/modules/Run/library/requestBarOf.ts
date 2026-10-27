import { NETWORK } from '@/modules/Run/constants';

/**
 * How much of its bar a request fills for how long it took, a decade at a time, so a slow
 * one stands out and a fast one still shows.
 */
export function requestBarOf(ms: number): number {
  const share = Math.log10(1 + Math.max(0, ms)) / NETWORK.barDecades;

  return Math.min(1, Math.max(NETWORK.barFloor, share));
}
