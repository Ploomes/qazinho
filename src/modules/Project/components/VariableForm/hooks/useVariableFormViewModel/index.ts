import type { IVariableFormProps } from '@/modules/Project/components/VariableForm/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useVariableFormViewModel = (
  props: Pick<IVariableFormProps, 'isSecret' | 'onSecret'>,
) => {
  const { t } = useTranslation();
  const [shownChoice, setShownChoice] = useState<boolean | null>(null);
  const isShown = shownChoice ?? !props.isSecret;

  return {
    isShown,
    eyeIcon: isShown ? ('eyeSlash' as const) : ('eye' as const),
    eyeLabel: isShown ? t('VARIABLES.HIDE_VALUE') : t('VARIABLES.SHOW_VALUE'),
    secretLabel: t('VARIABLES.SECRET'),
    secretTip: t('VARIABLES.SECRET_TIP'),
    onEye: () => {
      setShownChoice(!isShown);
    },
    onSecretSwitch: (isOn: boolean) => {
      setShownChoice(null);
      props.onSecret(isOn);
    },
  };
};
