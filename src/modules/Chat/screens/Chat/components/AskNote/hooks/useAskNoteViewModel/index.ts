import type { IAskNoteProps } from '@/modules/Chat/screens/Chat/components/AskNote/types';
import { useTranslation } from 'react-i18next';
import { answerLineOf } from '@/modules/Run';
import { EXPLORATION } from '@/shared/constants';

export const useAskNoteViewModel = (props: IAskNoteProps) => {
  const { message } = props;
  const { answer } = message;
  const { t } = useTranslation();

  const isAnswered = answer.kind === 'said' || answer.kind === 'secret';
  const line = answerLineOf(answer);

  return {
    label: t('CHAT.ASKED_LABEL'),
    where:
      message.caseId === EXPLORATION.caseId
        ? message.stepNumber > 0
          ? t('CHAT.ASKED_AT_SCREEN', { step: message.stepNumber })
          : ''
        : t('CHAT.ASKED_AT_STEP', { caseId: message.caseId, step: message.stepNumber }),
    question: message.question,
    isAnswered,
    isSecret: answer.kind === 'secret',
    who: t('CHAT.YOU'),
    answer: line.kind === 'words' ? line.text : t(line.key as never, { name: line.name }),
    className: isAnswered ? 'ask-note' : 'ask-note ask-note--unanswered',
  };
};
