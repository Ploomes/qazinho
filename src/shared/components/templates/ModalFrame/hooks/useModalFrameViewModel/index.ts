import type { IModalFrameProps } from '@/shared/components/templates/ModalFrame/types';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { MODAL_FRAME } from '@/shared/components/templates/ModalFrame/constants';

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
    isBeside: props.nav !== undefined,
    panelStyle: {
      width: props.width,
      height: props.height,
      '--modal-nav-width': `${String(MODAL_FRAME.navWidth)}px`,
    } as CSSProperties,
    onConfirmClick: () => {
      if (canConfirm) onConfirm();
    },
  };
};
