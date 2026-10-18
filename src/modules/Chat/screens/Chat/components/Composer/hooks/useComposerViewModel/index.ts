import type { IComposerProps } from '@/modules/Chat/screens/Chat/components/Composer/types';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useState } from 'react';

export const useComposerViewModel = (props: IComposerProps) => {
  const { value, mentions, onChange, onSend, onPickMention } = props;
  const [highlight, setHighlight] = useState(0);
  const [dismissedAt, setDismissedAt] = useState<string | null>(null);

  const canSend = value.trim().length > 0;
  const isPickerOpen = mentions.length > 0 && dismissedAt !== value;
  const highlighted = Math.min(highlight, mentions.length - 1);

  const onSendClick = () => {
    if (canSend) onSend();
  };

  const pick = (id: string) => {
    setHighlight(0);
    onPickMention(id);
  };

  const onPickerKey = (event: KeyboardEvent<HTMLInputElement>): boolean => {
    const picked = mentions[highlighted];

    if (event.key === 'ArrowDown') setHighlight((highlighted + 1) % mentions.length);
    else if (event.key === 'ArrowUp')
      setHighlight((highlighted - 1 + mentions.length) % mentions.length);
    else if ((event.key === 'Enter' || event.key === 'Tab') && picked) pick(picked.id);
    else if (event.key === 'Escape') setDismissedAt(value);
    else return false;

    return true;
  };

  return {
    canSend,
    isPickerOpen,
    highlighted,
    onSendClick,
    onPick: pick,
    onHighlight: setHighlight,
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
