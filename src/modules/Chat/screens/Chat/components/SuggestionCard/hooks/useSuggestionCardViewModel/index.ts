import type { ISuggestionCardProps } from '@/modules/Chat/screens/Chat/components/SuggestionCard/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export const useSuggestionCardViewModel = (props: ISuggestionCardProps) => {
  const { message, onTake } = props;
  const { t } = useTranslation();
  const [left, setLeft] = useState<number[]>([]);
  const chosen = message.cases.map((_, index) => index).filter((i) => !left.includes(i));

  return {
    eyebrow:
      message.from === 'outside'
        ? t('CHAT.SUGGESTED_OUTSIDE_EYEBROW')
        : t('CHAT.SUGGESTED_EYEBROW', { id: message.runId }),
    summary: message.summary,
    cases: message.cases.map((one, index) => ({
      key: `${String(index)}-${one.title}`,
      priority: one.priority,
      title: one.title,
      isChosen: !left.includes(index),
      canChoose: !message.isTaken,
      className: left.includes(index)
        ? 'suggestion-card__case suggestion-card__case--left'
        : 'suggestion-card__case',
      onChoose: () => {
        if (message.isTaken) return;
        setLeft((now) =>
          now.includes(index) ? now.filter((i) => i !== index) : [...now, index],
        );
      },
    })),
    isTaken: message.isTaken,
    canTake: chosen.length > 0,
    takeLabel:
      chosen.length === message.cases.length
        ? t('CHAT.SUGGESTED_TAKE')
        : t('CHAT.SUGGESTED_TAKE_SOME', { count: chosen.length }),
    takenLabel: t('CHAT.SUGGESTED_TAKEN'),
    onTake: () => {
      if (!message.isTaken && chosen.length > 0)
        onTake({ messageId: message.id, only: chosen });
    },
  };
};
