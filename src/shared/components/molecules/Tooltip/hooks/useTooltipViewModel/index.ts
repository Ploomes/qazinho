import type { ITooltipProps } from '@/shared/components/molecules/Tooltip/types';
import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';
import { TOOLTIP } from '@/shared/components/molecules/Tooltip/constants';

export const useTooltipViewModel = (
  props: Pick<ITooltipProps, 'side' | 'isOff' | 'isWide'>,
) => {
  const isBeside = props.side === 'right';
  const maxWidth = props.isWide === true ? TOOLTIP.wideMaxWidthPx : TOOLTIP.maxWidthPx;
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [place, setPlace] = useState<{
    top: number;
    side: number;
    edge: '--tooltip-left' | '--tooltip-right';
    tail: number;
    isAbove: boolean;
  } | null>(null);

  return {
    anchorRef,
    isOpen: isOpen && props.isOff !== true,
    isBeside,
    panelClassName: [
      'tooltip__panel',
      ...(isBeside ? ['tooltip__panel--beside'] : []),
      ...(!isBeside && place?.edge === '--tooltip-right'
        ? ['tooltip__panel--from-right']
        : []),
      ...(!isBeside && place?.isAbove === true ? ['tooltip__panel--above'] : []),
    ].join(' '),
    hidden: isBeside
      ? { opacity: 0, x: -4 }
      : { opacity: 0, y: place?.isAbove === true ? 4 : -4 },
    shown: isBeside ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 },
    style: {
      '--tooltip-max': `${String(maxWidth)}px`,
      '--tooltip-tail-size': `${String(TOOLTIP.tailPx)}px`,
      ...(place === null
        ? {}
        : {
            '--tooltip-top': `${String(place.top)}px`,
            [place.edge]: `${String(place.side)}px`,
            '--tooltip-tail': `${String(Math.max(place.tail, TOOLTIP.tailMinPx))}px`,
          }),
    } as CSSProperties,
    onOpen: () => {
      if (props.isOff === true) return;

      const anchor = anchorRef.current;

      if (anchor !== null) {
        const box = anchor.getBoundingClientRect();
        const isAbove = box.bottom + TOOLTIP.roomBelowPx > window.innerHeight;
        const top = isAbove
          ? box.top - TOOLTIP.belowGapPx
          : box.bottom + TOOLTIP.belowGapPx;

        setPlace(
          isBeside
            ? {
                top: Math.min(
                  Math.max(box.top + box.height / 2, TOOLTIP.edgePx),
                  window.innerHeight - TOOLTIP.edgePx,
                ),
                side: box.right + TOOLTIP.gapPx,
                edge: '--tooltip-left',
                tail: 0,
                isAbove: false,
              }
            : box.right < maxWidth + TOOLTIP.edgePx
              ? {
                  top,
                  side: Math.max(box.left, TOOLTIP.edgePx),
                  edge: '--tooltip-left',
                  tail: box.left + box.width / 2 - Math.max(box.left, TOOLTIP.edgePx),
                  isAbove,
                }
              : {
                  top,
                  side: Math.max(window.innerWidth - box.right, 0),
                  edge: '--tooltip-right',
                  tail: box.width / 2,
                  isAbove,
                },
        );
      }

      setOpen(true);
    },
    onClose: () => {
      setOpen(false);
    },
  };
};
