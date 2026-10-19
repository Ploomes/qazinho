import type { IComposerProps } from '@/modules/Chat/screens/Chat/components/Composer/types';
import type { IChatReference } from '@/shared/types';
import type { ChangeEvent, KeyboardEvent, UIEvent } from 'react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { splitMentions } from '@/modules/Chat/library';
import { MENTION_TABS } from '@/modules/Chat/screens/Chat/components/Composer/constants';

export const useComposerViewModel = (props: IComposerProps) => {
  const { value, mentions, mentionQuery, lockedText, onChange, onSend, onPickMention } =
    props;
  const { t } = useTranslation();
  const [highlight, setHighlight] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);
  const [chosenTab, setChosenTab] = useState<IChatReference['kind'] | null>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const isLocked = lockedText !== null;
  const canSend = !isLocked && value.trim().length > 0;
  const isPickerOpen = !isLocked && mentionQuery !== null && dismissedAt !== value;
  const filled = MENTION_TABS.filter((kind) =>
    mentions.some((mention) => mention.kind === kind),
  );
  const tab =
    chosenTab !== null && filled.includes(chosenTab) ? chosenTab : (filled[0] ?? 'case');
  const shown = mentions.filter((mention) => mention.kind === tab);
  const highlighted = Math.min(highlight, shown.length - 1);

  const onSendClick = () => {
    if (canSend) onSend();
  };

  const showTab = (kind: IChatReference['kind']) => {
    setChosenTab(kind);
    setHighlight(0);
  };

  const pick = (id: string) => {
    setHighlight(0);
    setChosenTab(null);
    onPickMention(id);
  };

  const onPickerKey = (event: KeyboardEvent<HTMLInputElement>): boolean => {
    const picked = shown[highlighted];
    const at = filled.indexOf(tab);

    if (event.key === 'Escape') setDismissedAt(value);
    else if (shown.length === 0) return false;
    else if (event.key === 'ArrowDown') setHighlight((highlighted + 1) % shown.length);
    else if (event.key === 'ArrowUp')
      setHighlight((highlighted - 1 + shown.length) % shown.length);
    else if (event.key === 'ArrowRight' && filled.length > 1)
      showTab(filled[(at + 1) % filled.length] ?? tab);
    else if (event.key === 'ArrowLeft' && filled.length > 1)
      showTab(filled[(at - 1 + filled.length) % filled.length] ?? tab);
    else if ((event.key === 'Enter' || event.key === 'Tab') && picked) pick(picked.id);
    else return false;

    return true;
  };

  return {
    mirrorRef,
    parts: splitMentions({ text: value, ids: props.referenceIds }).map((part, index) => ({
      ...part,
      key: `${String(index)}-${part.text}`,
    })),
    onInputScroll: (event: UIEvent<HTMLInputElement>) => {
      if (mirrorRef.current)
        mirrorRef.current.scrollLeft = event.currentTarget.scrollLeft;
    },
    canSend,
    isLocked,
    placeholder: lockedText ?? t('CHAT.PLACEHOLDER'),
    fieldClassName: isLocked
      ? 'composer__field composer__field--locked'
      : 'composer__field',
    isPickerOpen,
    highlighted,
    shown,
    tabs: MENTION_TABS.map((kind) => ({
      kind,
      count: mentions.filter((mention) => mention.kind === kind).length,
      isActive: kind === tab,
    })),
    onSendClick,
    onPick: pick,
    onHighlight: setHighlight,
    onTab: showTab,
    onInputChange: (event: ChangeEvent<HTMLInputElement>) => {
      setHighlight(0);
      onChange(event.target.value);
    },
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (isPickerOpen && onPickerKey(event)) {
        event.preventDefault();

        return;
      }

      if (event.key !== 'Enter' || event.shiftKey) return;

      event.preventDefault();
      onSendClick();
    },
  };
};
