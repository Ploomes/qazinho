import type { IModalFrameProps } from '@/shared/components/templates/ModalFrame/types';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useEffect, useId, useRef } from 'react';
import { MODAL_FRAME } from '@/shared/components/templates/ModalFrame/constants';
import {
  focusablesIn,
  isConfirmKey,
  wrappedFocus,
} from '@/shared/components/templates/ModalFrame/library';

export const useModalFrameViewModel = (props: IModalFrameProps) => {
  const { onCancel, onConfirm, canConfirm } = props;
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onCancel]);

  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;

    if (panel !== null && !panel.contains(document.activeElement)) {
      const items = focusablesIn(panel);
      const field = items.find((item) => /^(INPUT|TEXTAREA|SELECT)$/.test(item.tagName));

      (field ?? items[0] ?? panel).focus();
    }

    return () => {
      if (opener?.isConnected === true) opener.focus();
    };
  }, []);

  return {
    panelRef,
    titleId,
    isBeside: props.nav !== undefined,
    panelStyle: {
      width: props.width,
      height: props.height,
      '--modal-nav-width': `${String(MODAL_FRAME.navWidth)}px`,
    } as CSSProperties,
    onPanelKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      const target = event.target as HTMLElement;

      if (event.key === 'Tab') {
        const next = wrappedFocus({
          items: focusablesIn(event.currentTarget),
          current: document.activeElement as HTMLElement | null,
          isBack: event.shiftKey,
        });

        if (next !== null) {
          event.preventDefault();
          next.focus();
        }

        return;
      }

      if (
        isConfirmKey({
          key: event.key,
          isHandled: event.defaultPrevented,
          hasModifier: event.altKey || event.ctrlKey || event.metaKey || event.shiftKey,
          tag: target.tagName,
          type: target.getAttribute('type') ?? '',
          role: target.getAttribute('role'),
        })
      ) {
        event.preventDefault();
        if (canConfirm) onConfirm();
      }
    },
    onConfirmClick: () => {
      if (canConfirm) onConfirm();
    },
  };
};
