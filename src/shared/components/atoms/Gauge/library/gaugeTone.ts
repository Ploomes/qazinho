import type { GaugeTone } from '@/shared/components/atoms/Gauge/types';
import { GAUGE } from '@/shared/components/atoms/Gauge/constants';

/**
 * O tom de uma fração restante, de 0 a 1: tranquilo enquanto há espaço, apertado perto do
 * fim, vazio no fim.
 */
export function gaugeTone(left: number): GaugeTone {
  if (left <= GAUGE.emptyUnder) return 'empty';

  return left <= GAUGE.tightUnder ? 'tight' : 'easy';
}
