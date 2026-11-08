import type { ITooltipProps } from '@/shared/components/molecules/Tooltip/types';
import type { CSSProperties } from 'react';
import { useRef, useState } from 'react';
import { TOOLTIP } from '@/shared/components/molecules/Tooltip/constants';

export const useTooltipViewModel = (props: Pick<ITooltipProps, 'side' | 'isOff'>) => {
  const isBeside = props.side === 'right';
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [isOpen, setOpen] = useState(false);
  const [place, setPlace] = useState<{ top: number; side: number } | null>(null);

  return {
    anchorRef,
    isOpen: isOpen && props.isOff !== true,
    isBeside,
    panelClassName: isBeside ? 'tooltip__panel tooltip__panel--beside' : 'tooltip__panel',
    hidden: isBeside ? { opacity: 0, x: -4 } : { opacity: 0, y: -4 },
    shown: isBeside ? { opacity: 1, x: 0 } : { opacity: 1, y: 0 },
    style: {
      '--tooltip-max': `${String(TOOLTIP.maxWidthPx)}px`,
      ...(place === null
        ? {}
        : {
            '--tooltip-top': `${String(place.top)}px`,
            [isBeside ? '--tooltip-left' : '--tooltip-right']: `${String(place.side)}px`,
          }),
    } as CSSProperties,
    onOpen: () => {
      if (props.isOff === true) return;

      const anchor = anchorRef.current;

      if (anchor !== null) {
        const box = anchor.getBoundingClientRect();

        setPlace(
          isBeside
            ? {
                top: Math.min(
                  Math.max(box.top + box.height / 2, TOOLTIP.edgePx),
                  window.innerHeight - TOOLTIP.edgePx,
                ),
                side: box.right + TOOLTIP.gapPx,
              }
            : {
                top: box.bottom + TOOLTIP.belowGapPx,
                side: Math.max(window.innerWidth - box.right, 0),
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
