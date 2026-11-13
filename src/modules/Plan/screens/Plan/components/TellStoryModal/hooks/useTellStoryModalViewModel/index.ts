import type { ITellStoryModalProps } from '@/modules/Plan/screens/Plan/components/TellStoryModal/types';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TELL_STORY_MODAL } from '@/modules/Plan/screens/Plan/components/TellStoryModal/constants';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { Jira } from '@/services';

export const useTellStoryModalViewModel = (props: ITellStoryModalProps) => {
  const { storyKey, onPosted } = props;
  const { t } = useTranslation();
  const [text, setText] = useState(props.note);
  const [isPosting, setPosting] = useState(false);
  const [failure, setFailure] = useState('');

  return {
    title: t('PLAN.TELL_TITLE', { key: storyKey }),
    subtitle: t('PLAN.TELL_SUBTITLE'),
    width: TELL_STORY_MODAL.width,
    label: t('PLAN.TELL_LABEL'),
    text,
    confirmLabel: t('PLAN.TELL_POST'),
    canConfirm: !isPosting && text.trim() !== '',
    hint: failure === '' ? undefined : failure,
    onText: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    onCancel: props.onCancel,
    onConfirm: () => {
      if (isPosting || text.trim() === '') return;

      setPosting(true);
      setFailure('');
      void Jira.tell({ key: storyKey, text: text.trim() }).then((posted) => {
        setPosting(false);

        if (posted.isPosted) onPosted(posted.url);
        else
          setFailure(
            posted.said !== '' ? posted.said : t(JIRA_FAILURE_KEYS[posted.failure]),
          );
      });
    },
  };
};
