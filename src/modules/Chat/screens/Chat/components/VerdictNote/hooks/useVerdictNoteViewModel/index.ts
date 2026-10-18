import type { IVerdictNoteProps } from '@/modules/Chat/screens/Chat/components/VerdictNote/types';
import { useTranslation } from 'react-i18next';

export const useVerdictNoteViewModel = (props: IVerdictNoteProps) => {
  const { message } = props;
  const { t } = useTranslation();

  return {
    title:
      message.stepNumber > 0
        ? t('CHAT.VERDICT_STEP', { number: message.stepNumber, action: message.action })
        : message.action,
    hasEvidence: message.expected !== null && message.got !== null,
  };
};
