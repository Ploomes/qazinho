import type { GaugeTone } from '@/shared/components/atoms/Gauge/types';
import { GAUGE } from '@/shared/components/atoms/Gauge/constants';

/** The tone of a share left, from 0 to 1: easy while there is room, tight near the end, empty at it. */
export function gaugeTone(left: number): GaugeTone {
  if (left <= GAUGE.emptyUnder) return 'empty';

  return left <= GAUGE.tightUnder ? 'tight' : 'easy';
}
