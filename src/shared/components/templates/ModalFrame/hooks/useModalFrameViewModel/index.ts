import type { IModalFrameProps } from '@/shared/components/templates/ModalFrame/types';
import { useEffect } from 'react';

export const useModalFrameViewModel = (props: IModalFrameProps) => {
  const { onCancel, onConfirm, canConfirm } = props;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel]);

  return {
    onConfirmClick: () => {
      if (canConfirm) onConfirm();
    },
  };
};
