import type { IInternProps } from '@/components/atoms/Intern/types';
import type { CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { INTERN, INTERN_MOODS } from '@/components/atoms/Intern/constants';
import { drawIntern } from '@/components/atoms/Intern/library';
import { useAppStore } from '@/store';

export const useInternViewModel = (props: IInternProps) => {
  const { mood, size = INTERN.defaultSize, isStill = false, isFigure = false } = props;
  const { t } = useTranslation();
  const theme = useAppStore((state) => state.theme);
  const isCalm = useReducedMotion() ?? false;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixels = Math.round(size * window.devicePixelRatio);
  const mark = INTERN.mark[theme];
  const isMoving = !isStill && !isCalm;

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');

    if (!context) return;

    const draw = (t: number) => {
      drawIntern({ context, size: pixels, mood, t, mark, isFigure });
    };

    draw(0);

    if (!isMoving) return;

    const began = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      draw(((now - began) / INTERN_MOODS[mood].loopMs) % 1);
      frame = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mood, pixels, mark, isFigure, isMoving]);

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
