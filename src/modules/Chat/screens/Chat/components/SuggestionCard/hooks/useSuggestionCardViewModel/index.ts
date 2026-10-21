import type { ISuggestionCardProps } from '@/modules/Chat/screens/Chat/components/SuggestionCard/types';
import { useTranslation } from 'react-i18next';

export const useSuggestionCardViewModel = (props: ISuggestionCardProps) => {
  const { message, onTake } = props;
  const { t } = useTranslation();

  return {
    eyebrow: t('CHAT.SUGGESTED_EYEBROW', { id: message.runId }),
    summary: message.summary,
    cases: message.cases.map((one, index) => ({
      key: `${String(index)}-${one.title}`,
      priority: one.priority,
      title: one.title,
    })),
    isTaken: message.isTaken,
    takeLabel: t('CHAT.SUGGESTED_TAKE'),
    takenLabel: t('CHAT.SUGGESTED_TAKEN'),
    onTake: () => {
      if (!message.isTaken) onTake(message.id);
    },
  };
};
