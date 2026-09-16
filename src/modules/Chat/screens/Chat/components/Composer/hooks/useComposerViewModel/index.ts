import type { IComposerProps } from '@/modules/Chat/screens/Chat/components/Composer/types';
import type { KeyboardEvent } from 'react';
import { useCallback } from 'react';

export const useComposerViewModel = (props: IComposerProps) => {
  const { value, onSend } = props;
  const canSend = value.trim().length > 0;

  const onSendClick = useCallback(() => {
    if (canSend) onSend();
  }, [canSend, onSend]);

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) return;

      event.preventDefault();
      onSendClick();
    },
    [onSendClick],
  );

  return { canSend, onSendClick, onKeyDown };
};
