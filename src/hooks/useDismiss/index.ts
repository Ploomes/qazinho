import { useEffect, useRef } from 'react';

/** Closes a popover on Escape or a press anywhere outside it, except on a control that opens one. */
export const useDismiss = <T extends HTMLElement>(onDismiss: () => void) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

    // A trigger toggles on its own click; dismissing on its press would reopen it right after.
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      if (ref.current?.contains(event.target)) return;
      if (event.target.closest('[aria-haspopup]')) return;

      onDismiss();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [onDismiss]);

  return ref;
};
