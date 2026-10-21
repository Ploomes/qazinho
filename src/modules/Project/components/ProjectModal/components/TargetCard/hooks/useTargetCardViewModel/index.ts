import type { ITargetCardProps } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMachineCheck } from '@/modules/Setup/hooks';

export const useTargetCardViewModel = (props: ITargetCardProps) => {
  const { lock } = props;
  const { t } = useTranslation();
  const { isChecking, check } = useMachineCheck();
  const [isGuiding, setGuiding] = useState(false);
  const setUp = lock?.setUp ?? null;
  const guide = setUp !== null && 'guide' in setUp ? setUp : null;

  return {
    isLocked: lock !== null,
    className: lock === null ? 'target-card' : 'target-card target-card--locked',
    bodyClassName:
      props.isStacked === true
        ? 'target-card__body target-card__body--stacked'
        : 'target-card__body',
    isGuiding: guide !== null && isGuiding,
    guide,
    checkLabel: isChecking ? t('SETUP.CHECKING') : t('SETUP.CHECK_AGAIN'),
    isChecking,
    onSetUp: () => {
      if (setUp !== null && 'onSetUp' in setUp) setUp.onSetUp();
      else setGuiding(true);
    },
    onBack: () => {
      setGuiding(false);
    },
    onCheckAgain: () => {
      void check();
    },
  };
};
