import type { IPlanStrategyProps } from '@/modules/Plan/screens/Plan/components/PlanStrategy/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { STRATEGY_ROWS } from '@/modules/Plan/screens/Plan/components/PlanStrategy/constants';

export const usePlanStrategyViewModel = (props: IPlanStrategyProps) => {
  const { t } = useTranslation();
  const [isOpen, setOpen] = useState(false);
  const rows = STRATEGY_ROWS.flatMap(({ field, labelKey }) => {
    const text = props.strategy[field].trim();

    return text === '' ? [] : [{ key: field, label: t(labelKey), text }];
  });

  return {
    label: t('PLAN.STRATEGY'),
    summary: rows[0]?.text ?? '',
    rows,
    isShown: rows.length > 0,
    isOpen,
    onToggle: () => {
      setOpen(!isOpen);
    },
  };
};
