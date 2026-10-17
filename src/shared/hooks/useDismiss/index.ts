import { useEffect, useRef } from 'react';

export const useDismiss = <T extends HTMLElement>(onDismiss: () => void) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss();
    };

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
