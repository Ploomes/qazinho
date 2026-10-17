import type { IMeterProps } from '@/shared/components/atoms/Meter/types';

export const useMeterViewModel = (props: IMeterProps) => {
  const clamped = Math.min(Math.max(props.value, 0), 1);

  return { percent: `${String(Math.round(clamped * 100))}%` };
};
