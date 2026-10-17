import type { IChipProps } from '@/shared/components/atoms/Chip/types';

export const useChipViewModel = (props: IChipProps) => {
  const { onClick, dotTone, hasCaret = false } = props;

  return {
    isPressable: onClick !== undefined,
    hasDot: dotTone !== undefined,
    dotTone: dotTone ?? 'var(--ink3)',
    hasCaret,
    popup: hasCaret ? ('menu' as const) : undefined,
    onChipClick: onClick ?? (() => undefined),
  };
};
