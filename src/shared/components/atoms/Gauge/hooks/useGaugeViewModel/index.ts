import type { IGaugeProps } from '@/shared/components/atoms/Gauge/types';
import { GAUGE } from '@/shared/components/atoms/Gauge/constants';
import { gaugeTone } from '@/shared/components/atoms/Gauge/library';

export const useGaugeViewModel = (props: IGaugeProps) => {
  const filled = Math.min(Math.max(props.value, 0), 1);
  const left = props.fills === 'used' ? 1 - filled : filled;

  const tone = gaugeTone(left);

  return {
    left,
    circumference: GAUGE.circumference,
    offset: GAUGE.circumference * (1 - filled),
    className: `gauge__used gauge__used--${tone}`,
  };
};
