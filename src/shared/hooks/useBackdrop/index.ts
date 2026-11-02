import type { PointerEvent } from 'react';
import { useRef } from 'react';

export const useBackdrop = (onClose: () => void) => {
  const startedOnBackdrop = useRef(false);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      startedOnBackdrop.current = event.target === event.currentTarget;
    },
    onClick: () => {
      const isOwn = startedOnBackdrop.current;

      startedOnBackdrop.current = false;
      if (isOwn) onClose();
    },
  };
};
