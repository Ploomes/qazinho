import type { IGaugeProps } from '@/components/atoms/Gauge/types';
import { GAUGE } from '@/components/atoms/Gauge/constants';

export const useGaugeViewModel = (props: IGaugeProps) => {
  const left = Math.min(Math.max(props.value, 0), 1);

  const tone =
    left <= GAUGE.emptyUnder ? 'empty' : left <= GAUGE.tightUnder ? 'tight' : 'easy';

  return {
    left,
    circumference: GAUGE.circumference,
    offset: GAUGE.circumference * (1 - left),
    className: `gauge__used gauge__used--${tone}`,
  };
};
