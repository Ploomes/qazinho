import type { ITooltipProps } from '@/shared/components/molecules/Tooltip/types';
import type { FocusEvent } from 'react';
import { useEffect, useId, useRef } from 'react';
import { useTooltipStore } from '@/store';
import { TIP_TIMING } from '@/store/TooltipStore/constants';

export const useTooltipViewModel = (props: ITooltipProps) => {
  const { content, isOff = false } = props;
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const groupOf = (anchor: HTMLElement) =>
    anchor.closest('[data-tooltip-group]') ?? anchor.parentElement;

  const cancelOpen = () => {
    if (openTimer.current !== null) clearTimeout(openTimer.current);
    openTimer.current = null;
  };

  const show = () => {
    const anchor = anchorRef.current;

    if (anchor === null || isOff) return;

    const box = anchor.getBoundingClientRect();

    useTooltipStore.getState().show({
      id,
      group: groupOf(anchor),
      box: {
        top: box.top,
        left: box.left,
        right: box.right,
        bottom: box.bottom,
        width: box.width,
        height: box.height,
      },
      content,
      side: props.side ?? 'below',
      isWide: props.isWide === true,
    });
  };

  const hide = (isGroupHovered: boolean) => {
    cancelOpen();
    useTooltipStore.getState().hide({ id, isGroupHovered });
  };

  useEffect(() => {
    if (isOff) {
      hide(false);
      return;
    }

    useTooltipStore.getState().update({ id, content });
  });

  useEffect(
    () => () => {
      if (openTimer.current !== null) clearTimeout(openTimer.current);
      useTooltipStore.getState().hide({ id, isGroupHovered: false });
    },
    [id],
  );

  return {
    anchorRef,
    className: props.isFill === true ? 'tooltip tooltip--fill' : 'tooltip',
    onPointerEnter: () => {
      if (isOff) return;

      cancelOpen();

      if (useTooltipStore.getState().isWarm(Date.now())) {
        show();
        return;
      }

      openTimer.current = setTimeout(show, TIP_TIMING.openDelayMs);
    },
    onPointerLeave: () => {
      const anchor = anchorRef.current;
      const group = anchor === null ? null : groupOf(anchor);

      hide(group?.matches(':hover') === true);
    },
    onFocus: (event: FocusEvent<HTMLSpanElement>) => {
      if (event.target.matches(':focus-visible')) show();
    },
    onBlur: () => {
      hide(false);
    },
  };
};
