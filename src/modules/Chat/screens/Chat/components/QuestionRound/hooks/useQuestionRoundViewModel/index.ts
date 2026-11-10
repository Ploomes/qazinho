import type { IQuestionRoundProps } from '@/modules/Chat/screens/Chat/components/QuestionRound/types';
import type { IQuestionAnswer } from '@/modules/Chat/types';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MOTION } from '@/shared/constants';

export const useQuestionRoundViewModel = (props: IQuestionRoundProps) => {
  const { message, isAnswerable, onAnswer, onVariables } = props;
  const { t } = useTranslation();
  const [drafts, setDrafts] = useState<IQuestionAnswer[]>(() =>
    message.questions.map(() => ({ picked: [], text: '' })),
  );
  const [at, setAt] = useState(0);
  const [openOwn, setOpenOwn] = useState<number[]>([]);
  const [isExpanded, setExpanded] = useState(false);

  const isAnswered = message.answers !== null;
  const isOpen = isAnswerable && !isAnswered;
  const shown = message.answers ?? drafts;
  const lastIndex = message.questions.length - 1;
  const current = message.questions[at];
  const draftNow = drafts[at];
  const isAnsweredDraft = ({ picked, text }: IQuestionAnswer) =>
    picked.length > 0 || text.trim().length > 0;
  const isComplete = drafts.every(isAnsweredDraft);
  const isOwnOpenNow = openOwn.includes(at);
  const canNext =
    isOpen &&
    draftNow !== undefined &&
    isAnsweredDraft(draftNow) &&
    (at < lastIndex || isComplete);

  const advance = (answers: IQuestionAnswer[]) => {
    if (at < lastIndex) {
      setAt(at + 1);

      return;
    }

    if (answers.every(isAnsweredDraft)) onAnswer({ messageId: message.id, answers });
  };

  const draftsWith = (change: { index: number; draft: IQuestionAnswer }) =>
    drafts.map((draft, index) => (index === change.index ? change.draft : draft));

  const pickAndGo = (change: { index: number; draft: IQuestionAnswer }) => {
    const next = draftsWith(change);

    setDrafts(next);
    setOpenOwn(openOwn.filter((index) => index !== change.index));
    advance(next);
  };

  const shownQuestions = message.questions
    .map((question, index) => ({ question, index }))
    .filter(({ index }) => !isOpen || index === at);

  return {
    showingKey: isOpen ? String(at) : 'all',
    swapTransition: { duration: MOTION.durationFast, ease: MOTION.ease },
    position: t('CHAT.QUESTIONS_POSITION', {
      at: at + 1,
      total: message.questions.length,
    }),
    hasPosition: isOpen && message.questions.length > 1,
    summary:
      message.questions.length === 1
        ? t('CHAT.QUESTIONS_ANSWERED_ONE')
        : t('CHAT.QUESTIONS_ANSWERED_OTHER', { count: message.questions.length }),
    isAnswered,
    isExpanded,
    isBodyShown: !isAnswered || isExpanded,
    bodyTransition: { duration: MOTION.duration, ease: MOTION.ease },
    isOpen,
    ownLabel: t('CHAT.QUESTIONS_OTHER'),
    ownNote: t('CHAT.QUESTIONS_OTHER_NOTE'),
    textLabel: t('CHAT.QUESTIONS_OWN'),
    hasFooter: isOpen,
    canBack: isOpen && at > 0,
    backLabel: t('CHAT.QUESTIONS_BACK'),
    hasNext:
      isOpen &&
      (current?.isMultiSelect === true ||
        isOwnOpenNow ||
        (draftNow !== undefined && isAnsweredDraft(draftNow))),
    canNext,
    nextLabel: at < lastIndex ? t('CHAT.QUESTIONS_NEXT') : t('CHAT.QUESTIONS_SEND'),
    questions: shownQuestions.map(({ question, index }) => {
      const answer = shown[index] ?? { picked: [], text: '' };

      return {
        key: `${String(index)}-${question.header}`,
        index,
        question: question.question,
        isMultiSelect: question.isMultiSelect,
        hint: question.isMultiSelect && !isAnswered ? t('CHAT.QUESTIONS_PICK_ANY') : '',
        text: answer.text,
        isOwnOpen: openOwn.includes(index),
        said: isAnswered ? answer.text.trim() : '',
        options: question.options
          .map((option) => {
            const names = (option.variables ?? []).map(({ name }) => name);

            return {
              label: option.label,
              tip: [option.description, names.join(', ')]
                .filter((part) => part !== '')
                .join(' · '),
              note: option.description,
              hasNote: option.description !== '' && !isAnswered,
              isPicked: answer.picked.includes(option.label),
              hasLock: names.length > 0,
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
          if (kept !== null)
            pickAndGo({
              index: picking.index,
              draft: {
                picked: question.isMultiSelect
                  ? [
                      ...draft.picked.filter((label) => label !== picking.label),
                      picking.label,
                    ]
                  : [picking.label],
                text: question.isMultiSelect ? draft.text : '',
                kept,
              },
            });
        });

        return;
      }

      if (question.isMultiSelect) {
        setDrafts(
          draftsWith({
            index: picking.index,
            draft: {
              ...draft,
              picked: draft.picked.includes(picking.label)
                ? draft.picked.filter((label) => label !== picking.label)
                : [...draft.picked, picking.label],
            },
          }),
        );

        return;
      }

      pickAndGo({
        index: picking.index,
        draft: { ...draft, picked: [picking.label], text: '' },
      });
    },
    onOwn: (index: number) => {
      const draft = drafts[index];

      if (!isOpen || !draft) return;

      if (openOwn.includes(index)) {
        setOpenOwn(openOwn.filter((one) => one !== index));
        setDrafts(draftsWith({ index, draft: { ...draft, text: '' } }));

        return;
      }

      setOpenOwn([...openOwn, index]);

      if (message.questions[index]?.isMultiSelect !== true)
        setDrafts(draftsWith({ index, draft: { ...draft, picked: [] } }));
    },
    onText: (typing: { index: number; text: string }) => {
      const draft = drafts[typing.index];

      if (!isOpen || !draft) return;

      setDrafts(
        draftsWith({ index: typing.index, draft: { ...draft, text: typing.text } }),
      );
    },
    onOwnKey: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter') return;

      event.preventDefault();

      if (canNext) advance(drafts);
    },
    onBack: () => {
      if (at > 0) setAt(at - 1);
    },
    onNext: () => {
      if (canNext) advance(drafts);
    },
    onToggle: () => {
      if (isAnswered) setExpanded(!isExpanded);
    },
  };
};
