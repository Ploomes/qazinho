import type { IQuestionRoundProps } from '@/modules/Chat/screens/Chat/components/QuestionRound/types';
import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUESTION_ROUND } from '@/modules/Chat/screens/Chat/components/QuestionRound/constants';
import { MOTION } from '@/shared/constants';

export const useQuestionRoundViewModel = (props: IQuestionRoundProps) => {
  const { message, isAnswerable, onAnswer, onVariables } = props;
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<IQuestionAnswer[]>(() =>
    message.questions.map(() => ({ picked: [], text: '' })),
  );
  const [isExpanded, setExpanded] = useState(false);

  const isAnswered = message.answers !== null;
  const isOpen = isAnswerable && !isAnswered;
  const shown = message.answers ?? drafts;
  const isComplete = drafts.every(
    ({ picked, text }) => picked.length > 0 || text.trim().length > 0,
  );

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
          .map((option) => {
            const isPicked = answer.picked.includes(option.label);
            const kept = answer.kept ?? [];

            const asked = (option.variables ?? []).map(({ name }) => name);
            const isKept = isPicked && asked.length > 0 && kept.length > 0;

            return {
              label: option.label,
              description: option.description,
              isPicked,
              secrets:
                asked.length === 0
                  ? null
                  : {
                      label: isKept
                        ? t('CHAT.QUESTIONS_KEPT')
                        : t('CHAT.QUESTIONS_VARIABLES'),
                      names: isKept ? kept : asked,
                      className: isKept
                        ? 'question-round__secrets question-round__secrets--kept'
                        : 'question-round__secrets',
                    },
            };
          })
          .filter(({ isPicked }) => isPicked || !isAnswered),
      };
    }),
    onPick: (picking: { index: number; label: string }) => {
      const question = message.questions[picking.index];
      const draft = drafts[picking.index];

      if (!isOpen || !question || !draft) return;

      const variables =
        question.options.find(({ label }) => label === picking.label)?.variables ?? [];

      if (variables.length > 0) {
        void onVariables(variables).then((kept) => {
          if (kept === null) return;

          setDrafts((current) =>
            current.map((one, index) =>
              index === picking.index
                ? {
                    ...one,
                    picked: question.isMultiSelect
                      ? [
                          ...one.picked.filter((label) => label !== picking.label),
                          picking.label,
                        ]
                      : [picking.label],
                    kept,
                  }
                : one,
            ),
          );
        });

        return;
      }

      const toggled = draft.picked.includes(picking.label)
        ? draft.picked.filter((label) => label !== picking.label)
        : [...draft.picked, picking.label];

      setDrafts(
        draftsWith({
          index: picking.index,
          draft: { ...draft, picked: question.isMultiSelect ? toggled : [picking.label] },
        }),
      );
    },
    onText: (typing: { index: number; text: string }) => {
      const draft = drafts[typing.index];

      if (!isOpen || !draft) return;

      setDrafts(
        draftsWith({ index: typing.index, draft: { ...draft, text: typing.text } }),
      );
    },
    onSend: () => {
      if (isOpen && isComplete) onAnswer({ messageId: message.id, answers: drafts });
    },
    onToggle: () => {
      if (isAnswered) setExpanded(!isExpanded);
    },
  };
};
