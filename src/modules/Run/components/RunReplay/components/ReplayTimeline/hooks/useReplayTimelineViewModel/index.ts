import type { IReplayTimelineProps } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/types';
import type { CSSProperties, PointerEvent } from 'react';
import { useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import { REPLAY_TIMELINE } from '@/modules/Run/components/RunReplay/components/ReplayTimeline/constants';
import { REPLAY } from '@/modules/Run/constants';
import { momentAt } from '@/modules/Run/library';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { MOTION, STICKER } from '@/shared/constants';

export const useReplayTimelineViewModel = (props: IReplayTimelineProps) => {
  const { timeline, progress, take, flashBugId, faults, onSeek, onScrub } = props;
  const { t } = useTranslation();
  const [hover, setHover] = useState<number | null>(null);
  const isScrubbing = useRef(false);
  const playedClip = useTransform(
    progress,
    (value) => `inset(0 ${String((1 - value) * 100)}% 0 0)`,
  );
  const playheadLeft = useTransform(progress, (value) => `${String(value * 100)}%`);

  const duration = timeline.durationMs;
  const percent = (ms: number) => `${String(duration > 0 ? (ms / duration) * 100 : 0)}%`;
  const hoverMs = hover === null ? null : hover * duration;
  const hovered = hoverMs === null ? null : momentAt({ timeline, ms: hoverMs });
  const hoveredChapter = timeline.chapters[hovered?.chapterIndex ?? -1] ?? null;
  const hoveredStep = hoveredChapter?.steps[hovered?.stepIndex ?? -1] ?? null;

  const ratioOf = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();

    return box.width > 0
      ? Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
      : 0;
  };

  return {
    style: {
      '--rail': `${String(REPLAY_TIMELINE.railPx)}px`,
      '--rail-hover': `${String(REPLAY_TIMELINE.railHoverPx)}px`,
      '--rail-hovered': `${String(REPLAY_TIMELINE.railHoveredPx)}px`,
      '--head': `${String(REPLAY_TIMELINE.headPx)}px`,
      '--pin': `${String(REPLAY_TIMELINE.pinPx)}px`,
      '--preview': `${String(REPLAY_TIMELINE.previewPx)}px`,
    } as CSSProperties,
    label: t('RUN.REPLAY_TIMELINE'),
    valueNow: Math.round(props.currentMs),
    valueMax: Math.round(duration),
    valueText: formatElapsed(props.currentMs / 1000),
    playedClip,
    playheadLeft,
    chapters: timeline.chapters.map((chapter, index) => {
      const length = Math.max(1, chapter.toMs - chapter.fromMs);
      const isOutside =
        take !== null && (chapter.toMs <= take.fromMs || chapter.fromMs >= take.toMs);
      const tone = STATUS[chapter.verdict].tone;
      const isHovered = hovered?.chapterIndex === index;

      return {
        key: chapter.caseId,
        className: [
          'replay-timeline__chapter',
          `replay-timeline__chapter--${tone}`,
          ...(isOutside ? ['replay-timeline__chapter--outside'] : []),
          ...(isHovered ? ['replay-timeline__chapter--hovered'] : []),
        ].join(' '),
        playedClassName: [
          'replay-timeline__lit',
          `replay-timeline__lit--${tone}`,
          ...(isOutside ? ['replay-timeline__lit--outside'] : []),
          ...(isHovered ? ['replay-timeline__lit--hovered'] : []),
        ].join(' '),
        style: {
          '--from': percent(chapter.fromMs),
          '--width': percent(chapter.toMs - chapter.fromMs),
        } as CSSProperties,
        delay: Math.min(index * REPLAY_TIMELINE.stagger, REPLAY_TIMELINE.maxStagger),
        ticks: chapter.steps.slice(1).map((step) => ({
          key: `${chapter.caseId}-${String(step.number)}`,
          style: {
            '--at': `${String(((step.fromMs - chapter.fromMs) / length) * 100)}%`,
          } as CSSProperties,
        })),
      };
    }),
    take:
      take === null
        ? null
        : {
            style: {
              '--from': percent(take.fromMs),
              '--width': percent(take.toMs - take.fromMs),
            } as CSSProperties,
          },
    faults: faults.map((ms, index) => ({
      key: `${String(index)}-${String(ms)}`,
      style: { '--at': percent(ms) } as CSSProperties,
    })),
    faultTransition: { duration: MOTION.duration, ease: MOTION.ease },
    pins: timeline.marks.map((mark, index) => ({
      key: mark.bugId,
      animate:
        mark.bugId === flashBugId
          ? {
              ...STICKER.pop.animate,
              scale: [...STICKER.wobble.scale],
              transition: STICKER.wobble.transition,
            }
          : {
              ...STICKER.pop.animate,
              transition: {
                ...STICKER.spring,
                delay:
                  Math.min(
                    timeline.chapters.length * REPLAY_TIMELINE.stagger,
                    REPLAY_TIMELINE.maxStagger,
                  ) +
                  REPLAY_TIMELINE.pinsAfter +
                  index * REPLAY_TIMELINE.stagger,
              },
            },
      className: `replay-timeline__pin replay-timeline__pin--${mark.severity}`,
      style: { '--at': percent(mark.atMs) } as CSSProperties,
      label: `${mark.bugId} · ${mark.title}`,
      callout: t('RUN.REPLAY_CAUGHT', { id: mark.bugId }),
      calloutClassName:
        duration > 0 && mark.atMs / duration > 1 - REPLAY_TIMELINE.edgeShare
          ? 'replay-timeline__callout replay-timeline__callout--end'
          : duration > 0 && mark.atMs / duration < REPLAY_TIMELINE.edgeShare
            ? 'replay-timeline__callout replay-timeline__callout--start'
            : 'replay-timeline__callout',
      title: mark.title,
      isFlashing: mark.bugId === flashBugId,
      onClick: () => {
        onSeek(Math.max(0, mark.atMs - REPLAY.bugLeadMs));
      },
    })),
    preview: {
      isShown: hover !== null,
      ms: hoverMs,
      className:
        hover === null
          ? 'replay-timeline__preview'
          : 'replay-timeline__preview replay-timeline__preview--shown',
      style: { '--x': `${String((hover ?? 0) * 100)}%` } as CSSProperties,
      time: formatElapsed((hoverMs ?? 0) / 1000),
      chapter:
        hoveredChapter === null
          ? ''
          : `${hoveredChapter.caseId} · ${hoveredChapter.title}`,
      step:
        hoveredStep === null || hovered?.isBetween === true
          ? ''
          : `${t('RUN.REPLAY_STEP', { number: hoveredStep.number })} · ${hoveredStep.action}`,
    },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      isScrubbing.current = true;
      onScrub(true);
      onSeek(ratioOf(event) * duration);
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const ratio = ratioOf(event);

      setHover(ratio);

      if (isScrubbing.current) onSeek(ratio * duration);
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => {
      if (!isScrubbing.current) return;

      event.currentTarget.releasePointerCapture(event.pointerId);
      isScrubbing.current = false;
      onScrub(false);
    },
    onPointerLeave: () => {
      if (!isScrubbing.current) setHover(null);
    },
  };
};
