import type { IQuestionRoundProps } from '@/modules/Chat/screens/Chat/components/QuestionRound/types';
import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUESTION_ROUND } from '@/modules/Chat/screens/Chat/components/QuestionRound/constants';
import { MOTION } from '@/shared/constants';

export const useQuestionRoundViewModel = (props: IQuestionRoundProps) => {
  const { message, isAnswerable, onAnswer } = props;
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<IQuestionAnswer[]>(() =>
    message.questions.map(() => ({ picked: [], text: '' })),
  );
  const [isExpanded, setExpanded] = useState(false);

  const isAnswered = message.answers !== null;
  const isOpen = isAnswerable && !isAnswered;
  const shown = message.answers ?? drafts;
  const isInstant =
    message.questions.length === 1 && message.questions[0]?.options.length === 1;
  const isComplete = drafts.every(
    ({ picked, text }) => picked.length > 0 || text.trim().length > 0,
  );

  const send = (answers: IQuestionAnswer[]) => {
    onAnswer({ messageId: message.id, answers });
  };

  const draftsWith = (change: { index: number; draft: IQuestionAnswer }) =>
    drafts.map((draft, index) => (index === change.index ? change.draft : draft));

  return {
    style: {
      '--option-min-width': `${String(QUESTION_ROUND.optionMinWidth)}px`,
    } as CSSProperties,
    eyebrow: t('CHAT.QUESTIONS'),
    summary:
      message.questions.length === 1
        ? t('CHAT.QUESTIONS_ANSWERED_ONE')
        : t('CHAT.QUESTIONS_ANSWERED_OTHER', { count: message.questions.length }),
    caret: isExpanded ? '▾' : '▸',
    isAnswered,
    isExpanded,
    isBodyShown: !isAnswered || isExpanded,
    bodyTransition: { duration: MOTION.duration, ease: MOTION.ease },
    isOpen,
    canSend: isOpen && isComplete,
    sendLabel: t('CHAT.QUESTIONS_SEND'),
    textLabel: t('CHAT.QUESTIONS_OWN'),
    questions: message.questions.map((question, index) => {
      const answer = shown[index] ?? { picked: [], text: '' };

      return {
        key: `${String(index)}-${question.header}`,
        index,
        header: question.header,
        question: question.question,
        isMultiSelect: question.isMultiSelect,
        hint: question.isMultiSelect && !isAnswered ? t('CHAT.QUESTIONS_PICK_ANY') : '',
        text: answer.text,
        said: isAnswered ? answer.text.trim() : '',
        options: question.options
          .map((option) => ({
            label: option.label,
            description: option.description,
            isPicked: answer.picked.includes(option.label),
          }))
          .filter(({ isPicked }) => isPicked || !isAnswered),
      };
    }),
    onPick: (picking: { index: number; label: string }) => {
      const question = message.questions[picking.index];
      const draft = drafts[picking.index];

      if (!isOpen || !question || !draft) return;

      const toggled = draft.picked.includes(picking.label)
        ? draft.picked.filter((label) => label !== picking.label)
        : [...draft.picked, picking.label];
      const next = draftsWith({
        index: picking.index,
        draft: { ...draft, picked: question.isMultiSelect ? toggled : [picking.label] },
      });

      if (isInstant) {
        send(next);

        return;
      }

      setDrafts(next);
    },
    onText: (typing: { index: number; text: string }) => {
      const draft = drafts[typing.index];

      if (!isOpen || !draft) return;

      setDrafts(
        draftsWith({ index: typing.index, draft: { ...draft, text: typing.text } }),
      );
    },
    onSend: () => {
      if (isOpen && isComplete) send(drafts);
    },
    onToggle: () => {
      if (isAnswered) setExpanded(!isExpanded);
    },
  };
};
