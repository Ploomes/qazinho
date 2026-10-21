import type { IReplayLogProps } from '@/modules/Run/components/RunReplay/components/ReplayLog/types';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import { REPLAY_LOG } from '@/modules/Run/components/RunReplay/components/ReplayLog/constants';
import { REPLAY } from '@/modules/Run/constants';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { MOTION } from '@/shared/constants';

export const useReplayLogViewModel = (props: IReplayLogProps) => {
  const { timeline, moment, onSeek } = props;
  const { t } = useTranslation();
  const currentRef = useRef<HTMLButtonElement>(null);
  const quietUntil = useRef(0);
  const count = timeline.chapters.length;
  const currentKey = `${String(moment.chapterIndex)}:${String(moment.stepIndex)}`;

  useEffect(() => {
    if (Date.now() < quietUntil.current) return;

    currentRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentKey]);

  return {
    eyebrow: count === 1 ? t('PLAN.CASES_ONE') : t('PLAN.CASES_OTHER', { count }),
    foldTransition: { duration: MOTION.duration, ease: MOTION.ease },
    nowTransition: { duration: MOTION.duration, ease: MOTION.ease },
    chapters: timeline.chapters.map((chapter, index) => {
      const isCurrent = index === moment.chapterIndex;
      const tone = STATUS[chapter.verdict].tone;

      return {
        key: chapter.caseId,
        id: chapter.caseId,
        title: chapter.title,
        duration: formatElapsed((chapter.toMs - chapter.fromMs) / 1000),
        glyph: STATUS[chapter.verdict].glyph,
        glyphClassName: `replay-log__glyph replay-log__glyph--${tone}`,
        className: isCurrent
          ? 'replay-log__chapter replay-log__chapter--current'
          : 'replay-log__chapter',
        isOpen: isCurrent,
        onClick: () => {
          onSeek(chapter.fromMs);
        },
        steps: chapter.steps.map((step, position) => {
          const isNow = isCurrent && !moment.isBetween && position === moment.stepIndex;

          return {
            key: `${chapter.caseId}-${String(step.number)}`,
            number: step.number,
            action: step.action,
            glyph: STATUS[step.verdict].glyph,
            glyphClassName: `replay-log__glyph replay-log__glyph--${STATUS[step.verdict].tone}`,
            className: isNow
              ? 'replay-log__step replay-log__step--now'
              : 'replay-log__step',
            isNow,
            ref: isNow ? currentRef : undefined,
            onClick: () => {
              onSeek(step.fromMs);
            },
            bugs: timeline.marks
              .filter(
                (mark) =>
                  mark.caseId === chapter.caseId && mark.stepNumber === step.number,
              )
              .map((mark) => ({
                key: mark.bugId,
                id: mark.bugId,
                title: mark.title,
                className: `replay-log__bug replay-log__bug--${mark.severity}`,
                onClick: () => {
                  onSeek(Math.max(0, mark.atMs - REPLAY.bugLeadMs));
                },
              })),
          };
        }),
      };
    }),
    onUserScroll: () => {
      quietUntil.current = Date.now() + REPLAY_LOG.quietMs;
    },
  };
};
