import { useReducedMotion } from 'motion/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { TIP_PLACE } from '@/shared/components/organisms/TooltipLayer/constants';
import { tipPlaceOf } from '@/shared/components/organisms/TooltipLayer/library';
import { MOTION, STICKER } from '@/shared/constants';
import { useTooltipStore } from '@/store';

export const useTooltipLayerViewModel = () => {
  const tip = useTooltipStore((state) => state.tip);
  const session = useTooltipStore((state) => state.session);
  const isReduced = useReducedMotion() === true;
  const measureRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState<{
    id: string;
    width: number;
    height: number;
    inner: number;
  } | null>(null);

  useLayoutEffect(() => {
    const measure = measureRef.current;
    const inner = measure?.firstElementChild;

    if (tip === null || measure === null || !(inner instanceof HTMLElement)) return;

    setSize({
      id: tip.id,
      width: measure.offsetWidth,
      height: measure.offsetHeight,
      inner: inner.getBoundingClientRect().width,
    });
  }, [tip]);

  const place =
    tip === null || size === null
      ? null
      : tipPlaceOf({
          box: tip.box,
          size,
          side: tip.side,
          viewport: { width: window.innerWidth, height: window.innerHeight },
        });
  const away =
    tip?.side === 'right'
      ? { x: -4, y: 0 }
      : { x: 0, y: place?.isAbove === true ? 4 : -4 };
  const glide = isReduced ? { duration: 0 } : STICKER.glide;
  const fade = { duration: MOTION.durationFast, ease: MOTION.ease };

  return {
    sizes: {
      '--tooltip-max': `${String(TIP_PLACE.maxWidthPx)}px`,
      '--tooltip-max-wide': `${String(TIP_PLACE.wideMaxWidthPx)}px`,
      '--tooltip-tail-size': `${String(TIP_PLACE.tailPx)}px`,
    },
    measureRef,
    measureClassName:
      tip?.isWide === true
        ? 'tooltip-layer__measure tooltip-layer__measure--wide'
        : 'tooltip-layer__measure',
    measured: tip?.content ?? null,
    panel:
      tip === null || place === null
        ? null
        : {
            key: session,
            className: [
              'tooltip-layer__panel',
              `tooltip-layer__panel--${tip.side === 'right' ? 'right' : place.isAbove ? 'above' : 'below'}`,
            ].join(' '),
            initial: {
              opacity: 0,
              x: place.x + away.x,
              y: place.y + away.y,
              width: place.width,
              height: place.height,
            },
            animate: {
              opacity: 1,
              x: place.x,
              y: place.y,
              width: place.width,
              height: place.height,
            },
            exit: { opacity: 0, x: place.x + away.x, y: place.y + away.y },
            transition: { ...fade, x: glide, y: glide, width: glide, height: glide },
            tail: { x: place.tailX, y: place.tailY, rotate: 45 },
            tailTransition: glide,
            label: {
              key: tip.id,
              content: tip.content,
              style: {
                '--tip-width': `${String(size?.id === tip.id ? size.inner : place.width)}px`,
              },
            },
            labelIn: {
              opacity: 1,
              transition: { ...fade, delay: STICKER.glide.duration / 4 },
            },
            labelOut: {
              opacity: 0,
              transition: { duration: MOTION.durationPress, ease: MOTION.easeIn },
            },
          },
  };
};
