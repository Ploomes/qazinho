import type { IIslandShown } from '@/modules/Island/screens/Island/types';
import type { IIslandFrame } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ISLAND_IDLE, ISLAND_SHAPE } from '@/modules/Island/screens/Island/constants';
import { useIslandAsk } from '@/modules/Island/screens/Island/hooks/useIslandAsk';
import { earWidthOf, questionKeyOf } from '@/modules/Island/screens/Island/library';
import { currentStepOf } from '@/modules/Run/library';
import { IslandView } from '@/services/IslandView';

export const useIslandViewModel = () => {
  const { t, i18n } = useTranslation();
  const [frame, setFrame] = useState<IIslandFrame | null>(null);
  const [isHovering, setHovering] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const [flash, setFlash] = useState(0);
  const pill = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [bodyHeight, setBodyHeight] = useState(0);
  const isOver = useRef(false);

  useEffect(
    () =>
      IslandView.onFrame((next) => {
        setFrame(next);
        void i18n.changeLanguage(next.island.language);
      }),
    [i18n],
  );

  useEffect(() => {
    const move = (event: MouseEvent) => {
      const box = pill.current?.getBoundingClientRect();
      const inside =
        box !== undefined &&
        event.clientX >= box.left &&
        event.clientX <= box.right &&
        event.clientY <= box.bottom;

      if (inside === isOver.current) return;

      isOver.current = inside;
      setHovering(inside);
      IslandView.hover(inside);
    };
    const leave = () => {
      if (!isOver.current) return;

      isOver.current = false;
      setHovering(false);
      IslandView.hover(false);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
    };
  }, []);

  const state = frame?.island.state ?? ISLAND_IDLE;
  const bar = frame?.barHeight ?? 0;
  const notch = frame?.notchWidth ?? 0;
  const questions = state.kind === 'asking' ? state.questions : [];
  const ask = useIslandAsk(questions);
  const isOpen = isHovering || ask.isHeld;
  const shown: IIslandShown | null =
    state.kind === 'running'
      ? {
          count:
            state.total > 0
              ? `${String(currentStepOf({ walked: state.done, total: state.total }))}/${String(state.total)}`
              : '',
          mood: state.isPaused ? 'sleeping' : 'running',
          icon: state.isPaused ? 'paused' : 'running',
          tone: state.isPaused ? 'paused' : 'running',
          title: state.name,
          line: state.isExploring
            ? t('ISLAND.EXPLORING')
            : state.isPaused
              ? t('ISLAND.PAUSED')
              : t('ISLAND.RUNNING'),
          detail: state.detail,
          progress: state.total > 0 ? state.done / state.total : null,
          canStop: true,
          openLabel: t('ISLAND.OPEN'),
          stopLabel: t('ISLAND.STOP'),
        }
      : state.kind === 'asking'
        ? {
            count: questions.length > 1 ? String(questions.length) : '',
            mood: 'thinking',
            icon: 'attention',
            tone: 'asking',
            title: '',
            line: '',
            detail: '',
            progress: null,
            canStop: false,
            openLabel: t('ISLAND.OPEN'),
            stopLabel: t('ISLAND.STOP'),
          }
        : state.kind === 'ended'
          ? {
              count: state.failed > 0 ? String(state.failed) : String(state.passed),
              mood: state.failed > 0 ? 'bug' : 'passed',
              icon: state.failed > 0 ? 'failed' : 'passed',
              tone: state.failed > 0 ? 'failed' : 'passed',
              title: state.name,
              line:
                state.failed > 0
                  ? t('ISLAND.ENDED_FAILED', {
                      passed: state.passed,
                      failed: state.failed,
                    })
                  : state.passed === 1
                    ? t('ISLAND.ENDED_PASSED_ONE')
                    : t('ISLAND.ENDED_PASSED', { passed: state.passed }),
              detail: '',
              progress: null,
              canStop: false,
              openLabel: t('ISLAND.OPEN'),
              stopLabel: t('ISLAND.STOP'),
            }
          : null;
  const closedWidth = Math.max(
    ISLAND_SHAPE.minFlatWidthPx,
    notch + earWidthOf(shown?.count ?? '') * 2,
  );
  const hasBody = isOpen && shown !== null;

  useEffect(() => {
    const open = body.current;

    if (!hasBody || open === null) return;

    const watch = new ResizeObserver(() => {
      setBodyHeight(open.offsetHeight);
    });

    watch.observe(open);

    return () => {
      watch.disconnect();
    };
  }, [hasBody]);

  const workspaceId =
    state.kind === 'running' || state.kind === 'ended' ? state.workspaceId : '';
  const keys = questions.map(questionKeyOf);

  if (keys.join('\n') !== seen.join('\n')) {
    setSeen(keys);

    if (keys.some((key) => !seen.includes(key))) setFlash((count) => count + 1);
  }

  return {
    shown,
    ask: ask.view,
    isOpen,
    pill,
    body,
    pillClassName: isOpen ? 'island__pill island__pill--open' : 'island__pill',
    flash,
    style: {
      '--island-bar': `${String(bar)}px`,
      '--island-notch': `${String(notch)}px`,
      '--island-pad': `${String(ISLAND_SHAPE.padPx)}px`,
      '--island-open': `${String(ISLAND_SHAPE.openWidthPx)}px`,
      '--island-options': `${String(ISLAND_SHAPE.optionsMaxPx)}px`,
    } as CSSProperties,
    internSize: ISLAND_SHAPE.internPx,
    size: {
      width: isOpen ? ISLAND_SHAPE.openWidthPx : closedWidth,
      height: isOpen ? bar + bodyHeight : bar,
      borderBottomLeftRadius: isOpen
        ? ISLAND_SHAPE.openRadiusPx
        : ISLAND_SHAPE.closedRadiusPx,
      borderBottomRightRadius: isOpen
        ? ISLAND_SHAPE.openRadiusPx
        : ISLAND_SHAPE.closedRadiusPx,
    },
    onOpen: () => {
      IslandView.act({ kind: 'open', workspaceId });
    },
    onStop: () => {
      IslandView.act({ kind: 'stop', workspaceId });
    },
  };
};
