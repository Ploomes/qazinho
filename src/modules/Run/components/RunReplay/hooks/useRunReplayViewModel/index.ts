import type { ReplayFocus } from '@/modules/Run/types';
import type { SaveOutcome } from '@/shared/types';
import type { CSSProperties, MouseEvent } from 'react';
import { useAnimationFrame, useMotionValue } from 'motion/react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatElapsed } from '@/modules/Device/library';
import { RUN_REPLAY } from '@/modules/Run/components/RunReplay/constants';
import { REPLAY } from '@/modules/Run/constants';
import {
  momentAt,
  replayTimelineOf,
  takeOf,
  withExplorationTitle,
} from '@/modules/Run/library';
import { Run } from '@/services';
import { STATUS } from '@/shared/components/atoms/StatusPill/constants';
import { SAVE_BUTTON } from '@/shared/components/organisms/Lightbox/constants';
import { MOTION } from '@/shared/constants';
import { useWindowWidth } from '@/shared/hooks';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useRunReplayViewModel = () => {
  const { t } = useTranslation();
  const replay = useAppStore((state) => state.replay);
  const closeReplay = useAppStore((state) => state.closeReplay);
  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === replay?.workspaceId) ?? null,
  );
  const [focus, setFocus] = useState<ReplayFocus>(replay?.focus ?? { kind: 'run' });
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [isReady, setReady] = useState(false);
  const [hasFailed, setFailed] = useState(false);
  const [isPlaying, setPlaying] = useState(false);
  const [rate, setRate] = useState<number>(REPLAY.rates[0]);
  const [currentMs, setCurrentMs] = useState(0);
  const [isTakeOver, setTakeOver] = useState(false);
  const [saving, setSaving] = useState<SaveOutcome | 'saving' | 'idle'>('idle');
  const [measuredRatio, setMeasuredRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const shownMs = useRef(0);
  const wasPlaying = useRef(false);
  const progress = useMotionValue(0);
  const windowWidth = useWindowWidth();

  const workspaceId = replay?.workspaceId ?? null;
  const runId = replay?.runId ?? null;
  const picked = workspace?.runs.find(({ id }) => id === runId) ?? null;
  const run =
    picked === null
      ? null
      : withExplorationTitle({ run: picked, title: t('RUN.EXPLORATION') });
  const bugs = workspace?.bugs ?? [];
  const timeline = run === null ? null : replayTimelineOf({ run, bugs });
  const take = timeline === null ? null : takeOf({ timeline, focus });
  const durationMs = timeline?.durationMs ?? 0;
  const moment =
    timeline === null
      ? { chapterIndex: -1, stepIndex: -1, isBetween: false }
      : momentAt({ timeline, ms: currentMs });
  const chapter = timeline?.chapters[moment.chapterIndex] ?? null;
  const step = chapter?.steps[moment.stepIndex] ?? null;
  const recordedRatio =
    run?.video && run.video.width > 0 && run.video.height > 0
      ? run.video.width / run.video.height
      : RUN_REPLAY.fallbackRatio;
  const flash =
    timeline?.marks.find(
      ({ atMs }) => currentMs >= atMs && currentMs - atMs <= RUN_REPLAY.flashMs,
    ) ?? null;

  useEffect(() => {
    if (workspaceId === null || runId === null) return;

    let isCurrent = true;

    void Run.replayUrl({ workspaceId, runId }).then((found) => {
      if (isCurrent) setUrl(found);
    });

    return () => {
      isCurrent = false;
    };
  }, [workspaceId, runId]);

  const show = (ms: number) => {
    shownMs.current = ms;
    setCurrentMs(ms);
    progress.set(durationMs > 0 ? ms / durationMs : 0);
  };

  const seek = (ms: number) => {
    const to = Math.min(Math.max(ms, 0), durationMs);
    const video = videoRef.current;

    if (video) video.currentTime = to / 1000;

    show(to);

    if (take !== null && to < take.toMs) setTakeOver(false);
  };

  const play = () => {
    const video = videoRef.current;

    if (!video || !isReady) return;

    if (take !== null && isTakeOver) seek(take.fromMs);

    void video.play().catch(() => undefined);
  };

  const togglePlay = () => {
    if (videoRef.current?.paused === false) videoRef.current.pause();
    else play();
  };

  const jumpChapter = (direction: 1 | -1) => {
    const chapters = timeline?.chapters ?? [];
    const target =
      direction === 1
        ? chapters.find(({ fromMs }) => fromMs > shownMs.current + 1)
        : chapters.findLast(({ fromMs }) => fromMs < shownMs.current - 1_000);

    seek(target?.fromMs ?? (direction === 1 ? durationMs : 0));
  };

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.key === 'Escape') closeReplay();
    else if (event.key === ' ') togglePlay();
    else if (event.key === 'ArrowLeft') seek(shownMs.current - REPLAY.seekMs);
    else if (event.key === 'ArrowRight') seek(shownMs.current + REPLAY.seekMs);
    else if (event.key === '[') jumpChapter(-1);
    else if (event.key === ']') jumpChapter(1);
    else return;

    event.preventDefault();
  });

  useEffect(() => {
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useAnimationFrame(() => {
    const video = videoRef.current;

    if (!video || !isReady || durationMs === 0) return;

    const ms = Math.min(video.currentTime * 1000, durationMs);

    progress.set(ms / durationMs);

    if (Math.abs(ms - shownMs.current) >= RUN_REPLAY.stateEveryMs) {
      shownMs.current = ms;
      setCurrentMs(ms);
    }

    if (take !== null && !isTakeOver && !video.paused && ms >= take.toMs) {
      video.pause();
      video.currentTime = take.toMs / 1000;
      show(take.toMs);
      setTakeOver(true);
    }
  });

  const kicker =
    focus.kind === 'case'
      ? t('RUN.REPLAY_CASE', { id: focus.caseId })
      : focus.kind === 'bug'
        ? t('RUN.REPLAY_BUG', { id: focus.bugId })
        : t('RUN.REPLAY_RUN', { id: runId ?? '' });

  const caption =
    chapter === null || step === null
      ? {
          key: 'opening',
          kicker: '',
          text: t('RUN.REPLAY_OPENING'),
          glyph: '…',
          tone: 'quiet',
        }
      : moment.isBetween
        ? {
            key: `between-${chapter.caseId}`,
            kicker: '',
            text: t('RUN.REPLAY_BETWEEN'),
            glyph: '↻',
            tone: 'quiet',
          }
        : {
            key: `${chapter.caseId}-${String(step.number)}`,
            kicker: `${chapter.caseId} · ${t('RUN.REPLAY_STEP', { number: step.number })}`,
            text: step.action,
            glyph: STATUS[step.verdict].glyph,
            tone: STATUS[step.verdict].tone,
          };

  return {
    isOpen: replay !== null && run !== null && timeline !== null,
    kicker,
    title:
      focus.kind === 'bug'
        ? (bugs.find(({ id }) => id === focus.bugId)?.title ?? run?.meta ?? '')
        : focus.kind === 'case'
          ? (timeline?.chapters.find(({ caseId }) => caseId === focus.caseId)?.title ??
            '')
          : (run?.meta ?? ''),
    closeLabel: t('COMMON.CLOSE'),
    canSave: url !== null && url !== undefined,
    isSaving: saving === 'saving',
    saveGlyph: SAVE_BUTTON[saving === 'idle' ? 'idle' : saving].glyph,
    saveLabel: t(SAVE_BUTTON[saving === 'idle' ? 'idle' : saving].labelKey),
    url: url ?? null,
    hasVideo: url !== null && url !== undefined,
    src: url ?? undefined,
    videoRef,
    panelStyle: {
      '--video-ratio': String(measuredRatio ?? recordedRatio),
      '--panel-width': `${String(RUN_REPLAY.panelWidthPx)}px`,
      '--panel-height': `${String(RUN_REPLAY.panelHeightPx)}px`,
      '--log-width': `${String(RUN_REPLAY.logWidthPx)}px`,
    } as CSSProperties,
    waitMood: RUN_REPLAY.waitMood,
    waitSize: RUN_REPLAY.waitSize,
    backdropTransition: { duration: MOTION.duration, ease: MOTION.ease },
    swapTransition: { duration: MOTION.durationFast, ease: MOTION.ease },
    isLoading: !hasFailed && (url === undefined || (url !== null && !isReady)),
    hasFailed: hasFailed || url === null,
    loadingText: t('RUN.REPLAY_LOADING'),
    missingText: t('RUN.REPLAY_MISSING'),
    caption: {
      key: caption.key,
      kicker: caption.kicker,
      text: caption.text,
      glyph: caption.glyph,
      glyphClassName: `run-replay__caption-glyph run-replay__caption-glyph--${caption.tone}`,
    },
    canWatchWhole: isTakeOver && focus.kind !== 'run',
    takeEndLabel: t('RUN.REPLAY_TAKE_END'),
    wholeLabel: t('RUN.REPLAY_WHOLE'),
    timeline,
    moment,
    progress,
    currentMs,
    take,
    flashBugId: flash?.bugId ?? null,
    isReady,
    isPlaying,
    playGlyph: isPlaying ? '❚❚' : '▶',
    playLabel: isPlaying ? t('RUN.REPLAY_PAUSE') : t('RUN.REPLAY_PLAY'),
    timeText: `${formatElapsed(currentMs / 1000)} / ${formatElapsed(durationMs / 1000)}`,
    chapterLabel:
      chapter === null
        ? { key: 'none', text: '' }
        : { key: chapter.caseId, text: `${chapter.caseId} · ${chapter.title}` },
    rateLabel: `${String(rate)}×`,
    rateTitle: t('RUN.REPLAY_SPEED'),
    hasKeys: windowWidth >= RUN_REPLAY.keysFromPx,
    keysHint: t('RUN.REPLAY_KEYS'),
    onClose: closeReplay,
    onPanelClick: (event: MouseEvent) => {
      event.stopPropagation();
    },
    onSave: () => {
      if (workspaceId === null || runId === null || saving === 'saving') return;

      setSaving('saving');
      void Run.saveReplay({
        workspaceId,
        runId,
        name: `${workspace?.name ?? workspaceId} ${runId}`,
      }).then(setSaving);
    },
    onLoaded: () => {
      setReady(true);

      const video = videoRef.current;

      if (!video) return;

      if (video.videoWidth > 0 && video.videoHeight > 0)
        setMeasuredRatio(video.videoWidth / video.videoHeight);

      video.currentTime = (take?.fromMs ?? 0) / 1000;
      show(take?.fromMs ?? 0);
      void video.play().catch(() => undefined);
    },
    onPlay: () => {
      setPlaying(true);
    },
    onPause: () => {
      setPlaying(false);
    },
    onError: () => {
      setFailed(true);
    },
    onTogglePlay: togglePlay,
    onSeek: seek,
    onScrub: (isScrubbing: boolean) => {
      const video = videoRef.current;

      if (!video) return;

      if (isScrubbing) {
        wasPlaying.current = !video.paused;
        video.pause();
      } else if (wasPlaying.current) play();
    },
    onRate: () => {
      const next =
        REPLAY.rates[(REPLAY.rates.indexOf(rate as never) + 1) % REPLAY.rates.length] ??
        REPLAY.rates[0];

      if (videoRef.current) videoRef.current.playbackRate = next;

      setRate(next);
    },
    onWatchWhole: () => {
      setFocus({ kind: 'run' });
      setTakeOver(false);
      void videoRef.current?.play().catch(() => undefined);
    },
  };
};
