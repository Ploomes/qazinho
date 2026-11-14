import type { IMeetingModalProps } from '@/modules/Plan/screens/Plan/components/MeetingModal/types';
import type { ChangeEvent, DragEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { meetingNameOf, transcriptOf } from '@/modules/Plan/library';
import { MEETING_MODAL } from '@/modules/Plan/screens/Plan/components/MeetingModal/constants';

export const useMeetingModalViewModel = (props: IMeetingModalProps) => {
  const { onRead } = props;
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [minutes, setMinutes] = useState<number | null>(null);

  const take = (file: File | undefined) => {
    if (file === undefined) return;

    void file.text().then((raw) => {
      const read = transcriptOf(raw);

      setName(file.name);
      setText(read.text);
      setMinutes(read.minutes);
    });
  };

  return {
    title: t('PLAN.READ_MEETING'),
    subtitle: t('PLAN.MEETING_SUBTITLE'),
    width: MEETING_MODAL.width,
    accept: MEETING_MODAL.accept,
    pickLabel: t('PLAN.MEETING_PICK'),
    textLabel: t('PLAN.MEETING_TEXT'),
    text,
    file:
      name === ''
        ? null
        : {
            name,
            minutes:
              minutes === null ? '' : t('PLAN.MEETING_MINUTES', { count: minutes }),
          },
    confirmLabel: t('PLAN.MEETING_REVIEW'),
    canConfirm: text.trim() !== '',
    onFile: (event: ChangeEvent<HTMLInputElement>) => {
      take(event.target.files?.[0]);
    },
    onDragOver: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
    },
    onDrop: (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      take(event.dataTransfer.files[0]);
    },
    onText: (event: ChangeEvent<HTMLTextAreaElement>) => {
      setText(event.target.value);
    },
    onCancel: props.onCancel,
    onConfirm: () => {
      const read = transcriptOf(text).text;

      if (read === '') return;

      onRead({
        name:
          name === ''
            ? meetingNameOf({ text: read, fallback: t('PLAN.MEETING_PASTED') })
            : name,
        text: read,
      });
    },
  };
};
