import type { ITargetCardProps } from '@/modules/Project/components/ProjectModal/components/TargetCard/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMachineCheck } from '@/modules/Setup/hooks';

export const useTargetCardViewModel = (props: ITargetCardProps) => {
  const { lock } = props;
  const { t } = useTranslation();
  const { isChecking, check } = useMachineCheck();
  const [isGuiding, setGuiding] = useState(false);

  return {
    isLocked: lock !== null,
    isGuiding: lock !== null && lock.setUp !== null && isGuiding,
    checkLabel: isChecking ? t('SETUP.CHECKING') : t('SETUP.CHECK_AGAIN'),
    isChecking,
    onSetUp: () => {
      setGuiding(true);
    },
    onBack: () => {
      setGuiding(false);
    },
    onCheckAgain: () => {
      void check();
    },
  };
};
