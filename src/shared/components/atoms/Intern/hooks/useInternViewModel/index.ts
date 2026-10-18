import type { IInternProps } from '@/shared/components/atoms/Intern/types';
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { INTERN, INTERN_MOODS } from '@/shared/components/atoms/Intern/constants';
import { drawIntern } from '@/shared/components/atoms/Intern/library';
import { useAppStore } from '@/store';

export const useInternViewModel = (props: IInternProps) => {
  const {
    mood,
    size = INTERN.defaultSize,
    isStill = false,
    isFigure = false,
    isOnIndigo = false,
  } = props;
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const isCalm = useReducedMotion() ?? false;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixels = Math.round(size * window.devicePixelRatio);
  const shadow = isOnIndigo ? INTERN.shadow.indigo : INTERN.shadow[theme];
  const isMoving = !isStill && !isCalm;

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');

    if (!context) return;

    const sheet = document.createElement('canvas');

    sheet.width = pixels;
    sheet.height = pixels;

    const layer = sheet.getContext('2d');

    if (!layer) return;

    const draw = (phase: number) => {
      drawIntern({ context, layer, size: pixels, mood, t: phase, shadow, isFigure });
    };

    draw(INTERN_MOODS[mood].stillAt);

    if (!isMoving) return;

    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      draw(((now - began) / INTERN_MOODS[mood].loopMs) % 1);
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mood, pixels, shadow, isFigure, isMoving]);

  return {
    canvasRef,
    pixels,
    alt: t('MASCOT.ALT', {
      name: t('MASCOT.NAME'),
      mood: t(INTERN_MOODS[mood].labelKey as 'MASCOT.MOOD_NEUTRAL'),
    }),
    style: { '--intern-size': `${String(size)}px` } as CSSProperties,
  };
};
