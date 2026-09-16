import type { IGaugeProps } from '@/components/atoms/Gauge/types';
import { GAUGE } from '@/components/atoms/Gauge/constants';

export const useGaugeViewModel = (props: IGaugeProps) => {
  const filled = Math.min(Math.max(props.value, 0), 1);
  const left = props.fills === 'used' ? 1 - filled : filled;

  const tone =
    left <= GAUGE.emptyUnder ? 'empty' : left <= GAUGE.tightUnder ? 'tight' : 'easy';

  return {
    left,
    circumference: GAUGE.circumference,
    offset: GAUGE.circumference * (1 - filled),
    className: `gauge__used gauge__used--${tone}`,
  };
};
