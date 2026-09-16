import type { IStatusPillProps } from '@/components/atoms/StatusPill/types';
import { STATUS } from '@/components/atoms/StatusPill/constants';

export const useStatusPillViewModel = (props: IStatusPillProps) => {
  const { status, label, shape = 'square' } = props;
  const { glyph, label: word, tone } = STATUS[status];

  return {
    glyph,
    label: label ?? word,
    className: ['status-pill', `status-pill--${tone}`, `status-pill--${shape}`].join(' '),
  };
};
