import type { IDoubtsModalProps } from '@/modules/Plan/screens/Plan/components/DoubtsModal/types';
import type { StoryPeople } from '@/shared/types';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DOUBTS_MODAL } from '@/modules/Plan/screens/Plan/components/DoubtsModal/constants';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Jira } from '@/services';

export const useDoubtsModalViewModel = (props: IDoubtsModalProps) => {
  const { storyKey, onPosted } = props;
  const { t } = useTranslation();
  const [people, setPeople] = useState<StoryPeople | null>(null);
  const [intro, setIntro] = useState(() => props.texts?.intro ?? t('PLAN.DOUBTS_INTRO'));
  const [questions, setQuestions] = useState(() =>
    props.doubts.map(({ id, question }) => ({ id, question })),
  );
  const [wantsToWatch, setWantsToWatch] = useState(true);
  const [isPosting, setPosting] = useState(false);
  const [failure, setFailure] = useState('');

  useEffect(() => {
    let isLive = true;

    void Jira.people(storyKey).then((read) => {
      if (isLive) setPeople(read);
    });

    return () => {
      isLive = false;
    };
  }, [storyKey]);

  const reporter = people?.isRead === true ? people.reporter : null;
  const isWatching = people?.isRead === true && people.isWatching;
  const closing =
    props.texts?.closing ?? t('PLAN.DOUBTS_CLOSING', { id: questions[0]?.id ?? 'D1' });

  return {
    title: t('PLAN.DOUBTS_MODAL_TITLE', { key: storyKey }),
    subtitle: t('PLAN.DOUBTS_MODAL_SUBTITLE'),
    width: DOUBTS_MODAL.width,
    confirmLabel: isPosting ? t('PLAN.DOUBTS_POSTING') : t('PLAN.DOUBTS_POST'),
    canConfirm: !isPosting && questions.every(({ question }) => question.trim() !== ''),
    hint: failure === '' ? undefined : failure,
    introLabel: t('PLAN.DOUBTS_INTRO_LABEL'),
    intro,
    mention:
      reporter === null || reporter === ''
        ? null
        : t('PLAN.DOUBTS_MENTION', { name: reporter }),
    questions: questions.map(({ id, question }) => ({
      id,
      label: t('PLAN.DOUBTS_DOUBT_LABEL', { id }),
      value: question,
    })),
    closing,
    isWatching,
    watchingLabel: t('PLAN.DOUBTS_WATCHING'),
    watchLabel: t('PLAN.DOUBTS_WATCH'),
    wantsToWatch,
    onIntro: setIntro,
    onQuestion: (typed: { id: string; value: string }) => {
      setQuestions(
        questions.map((one) =>
          one.id === typed.id ? { ...one, question: typed.value } : one,
        ),
      );
    },
    onWatch: setWantsToWatch,
    onCancel: props.onCancel,
    onConfirm: () => {
      if (isPosting || questions.some(({ question }) => question.trim() === '')) return;

      setPosting(true);
      setFailure('');
      void Jira.askStory({
        key: storyKey,
        intro,
        doubts: questions,
        closing,
        isWatching: wantsToWatch && !isWatching,
      }).then((posted) => {
        setPosting(false);

        if (!posted.isPosted) {
          setFailure(
            posted.said !== '' ? posted.said : t(JIRA_FAILURE_KEYS[posted.failure]),
          );

          return;
        }

        onPosted({ sent: { url: posted.url, at: posted.at }, questions });
      });
    },
  };
};
