import type { IStatusPillProps } from '@/shared/components/atoms/StatusPill/types';
import { useTranslation } from 'react-i18next';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';

export const useStatusPillViewModel = (props: IStatusPillProps) => {
  const { status, label, shape = 'square' } = props;
  const { t } = useTranslation();
  const { glyph, labelKey, tone } = STATUS[status];

  return {
    glyph,
    label: label ?? t(labelKey),
    className: ['status-pill', `status-pill--${tone}`, `status-pill--${shape}`].join(' '),
  };
};
