import type { IAskCardProps } from '@/modules/Chat/screens/Chat/components/AskCard/types';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EXPLORATION, MOTION } from '@/shared/constants';

export const useAskCardViewModel = (props: IAskCardProps) => {
  const { question, onAnswer } = props;
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [isMadeSecret, setMadeSecret] = useState(false);
  const [isKept, setKept] = useState(false);
  const [isSent, setSent] = useState(false);

  const isSecret = question.isSecret || isMadeSecret;
  const canSend = !isSent && (isSecret ? text.length > 0 : text.trim().length > 0);
  const isExploring = question.caseId === EXPLORATION.caseId;

  const send = () => {
    if (!canSend) return;

    setSent(true);
    onAnswer(isSecret ? { kind: 'secret', value: text, isKept } : { kind: 'said', text });
  };

  return {
    eyebrow: t('CHAT.ASK_EYEBROW'),
    where: isExploring
      ? question.action.length > 0
        ? t('CHAT.ASK_AT_SCREEN', { screen: question.action })
        : t('CHAT.ASK_EXPLORING')
      : t('CHAT.ASKED_AT_STEP', {
          caseId: question.caseId,
          step: question.stepNumber,
        }),
    question: question.question,
    hasOptions: !isSecret && question.options.length > 0,
    options: isSecret
      ? []
      : question.options.map((label) => ({
          label,
          onPick: () => {
            if (isSent) return;

            setSent(true);
            onAnswer({ kind: 'said', text: label });
          },
        })),
    text,
    fieldLabel: isSecret
      ? t('CHAT.ASK_SECRET_FIELD')
      : question.options.length > 0
        ? t('CHAT.ASK_OWN')
        : t('CHAT.ASK_ANSWER'),
    isSecret,
    canMakeSecret: !question.isSecret,
    secretLabel: t('CHAT.ASK_MAKE_SECRET'),
    secretTip: t('CHAT.ASK_MAKE_SECRET_TIP'),
    isKept,
    keepLabel: t('CHAT.ASK_KEEP'),
    className: isSent ? 'ask-card ask-card--sent' : 'ask-card',
    canSend,
    sendLabel: t('CHAT.ASK_SEND'),
    foldTransition: { duration: MOTION.duration, ease: MOTION.ease },
    onText: (typed: string) => {
      if (!isSent) setText(typed);
    },
    onSecret: (isOn: boolean) => {
      if (isSent || question.isSecret) return;

      setMadeSecret(isOn);
    },
    onKeep: (isOn: boolean) => {
      if (!isSent && isSecret) setKept(isOn);
    },
    onSend: send,
    onSubmit: (event: FormEvent) => {
      event.preventDefault();
      send();
    },
  };
};
