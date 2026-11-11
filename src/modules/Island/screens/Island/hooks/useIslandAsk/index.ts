import type { IIslandAskProps } from '@/modules/Island/screens/Island/components/IslandAsk/types';
import type { IIslandQuestion } from '@/shared/types';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { questionKeyOf } from '@/modules/Island/screens/Island/library';
import { IslandView } from '@/services/IslandView';

export const useIslandAsk = (
  questions: IIslandQuestion[],
): { isHeld: boolean; view: IIslandAskProps | null } => {
  const { t } = useTranslation();
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [sent, setSent] = useState<string[]>([]);
  const [isFieldHeld, setFieldHeld] = useState(false);
  const fieldRef = useRef<HTMLInputElement>(null);
  const keys = questions.map(questionKeyOf);
  const at = Math.max(keys.indexOf(currentKey ?? ''), 0);
  const current = questions[at] ?? null;
  const key = keys[at] ?? '';
  const draft = drafts[key] ?? '';
  const isSent = sent.includes(key);
  const isHeld = isFieldHeld && current !== null && !current.isSecret;

  if (isFieldHeld && !isHeld) setFieldHeld(false);

  useEffect(() => {
    IslandView.keyboard(isHeld);
  }, [isHeld]);

  if (current === null) return { isHeld, view: null };

  const send = (text: string) => {
    if (isSent || text.trim().length === 0) return;

    setSent([...sent, key]);
    IslandView.act({
      kind: 'answer',
      workspaceId: current.workspaceId,
      questionId: current.questionId,
      text: text.trim(),
    });
    fieldRef.current?.blur();
  };
  const move = (step: number) => {
    setCurrentKey(keys[(at + step + keys.length) % keys.length] ?? null);
  };
  const hasOptions = !current.isSecret && current.options.length > 0;

  return {
    isHeld,
    view: {
      title:
        current.project === ''
          ? current.workspace
          : `${current.project} / ${current.workspace}`,
      line: t('ISLAND.ASKING'),
      question: current.question,
      position:
        questions.length > 1
          ? t('ISLAND.POSITION', { at: at + 1, total: questions.length })
          : null,
      previousLabel: t('ISLAND.PREVIOUS'),
      nextLabel: t('ISLAND.NEXT'),
      hasOptions,
      options: hasOptions
        ? current.options.map((label) => ({
            label,
            onPick: () => {
              send(label);
            },
          }))
        : [],
      canType: !current.isSecret,
      draft,
      fieldLabel: hasOptions ? t('ISLAND.OWN_ANSWER_OR') : t('ISLAND.OWN_ANSWER'),
      fieldRef,
      canSend: !isSent && draft.trim().length > 0,
      sendLabel: t('ISLAND.SEND'),
      secretNote: current.isSecret ? t('ISLAND.SECRET_NOTE') : null,
      openLabel: current.isSecret ? t('ISLAND.ANSWER_IN_APP') : t('ISLAND.OPEN'),
      onPrevious: () => {
        move(-1);
      },
      onNext: () => {
        move(1);
      },
      onDraft: (text: string) => {
        setDrafts({ ...drafts, [key]: text });
      },
      onFieldPress: () => {
        setFieldHeld(true);
      },
      onFieldBlur: () => {
        setFieldHeld(false);
      },
      onFieldKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Escape') event.currentTarget.blur();

        if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
          event.preventDefault();
          send(draft);
        }
      },
      onSend: () => {
        send(draft);
      },
      onOpen: () => {
        IslandView.act({ kind: 'open', workspaceId: current.workspaceId });
      },
    },
  };
};
