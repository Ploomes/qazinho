import type { IDeviceStep, IViewportChoice, ViewportId } from '@/modules/Device/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEVICE, VIEWPORTS } from '@/modules/Device/constants';
import {
  deviceStateOf,
  formatElapsed,
  moodOfStatus,
  imageRatioOf,
  shownUrlOf,
  stepSectionsOf,
  stepVerdictsOf,
  viewportOf,
} from '@/modules/Device/library';
import { useRunControls } from '@/modules/Run';
import { Run } from '@/services';
import { MOTION } from '@/shared/constants';
import { useFollowEnd } from '@/shared/hooks/useFollowEnd';
import { useSelectedWorkspace } from '@/shared/hooks/useSelectedWorkspace';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useDeviceViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const workspace = useSelectedWorkspace();
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const openReplay = useAppStore((state) => state.openReplay);
  const {
    runSteps,
    live,
    isLive: isRunLive,
    isPaused,
    onPause,
    onStop,
  } = useRunControls();
  const [isFocusedNow, setFocused] = useState(false);

  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const state = deviceStateOf(workspace);
  const isPhone = workspace?.planKind === 'mobile';
  const viewport = viewportOf(workspace?.viewportId);
  const shot = live?.shot ?? null;
  const screenRatio = isPhone
    ? ((shot === null ? null : imageRatioOf(shot)) ?? DEVICE.phoneRatio)
    : viewport.width / viewport.height;

  const lastRun = workspace?.runs[0] ?? null;
  const verdicts = stepVerdictsOf({ steps: runSteps, live, lastRun });
  const isExploring = live?.kind === 'explore';
  const steps: IDeviceStep[] = isExploring
    ? live.outcomes.map((outcome, index) => ({
        number: index + 1,
        action: outcome.action,
        verdict: outcome.verdict,
      }))
    : runSteps.map((step, index) => ({
        number: index + 1,
        action: step.action,
        verdict: verdicts[index] ?? 'pending',
        caseId: step.caseId,
        caseTitle: step.caseTitle,
      }));
  const reached = steps.filter(({ verdict }) => verdict !== 'pending');
  const walked =
    live?.outcomes.length ??
    lastRun?.cases.reduce((total, runCase) => total + runCase.steps.length, 0) ??
    null;

  const hasScreen = isRunLive || (isFocusedNow && shot !== null);
  const isFocused = isFocusedNow && hasScreen;
  const stream = live?.isDone === false ? live.streamUrl : null;
  const viewports: IViewportChoice[] = isPhone
    ? []
    : VIEWPORTS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
        size: `${String(option.width)} × ${String(option.height)}`,
        isActive: option.id === viewport.id,
      }));
  const workspaceId = workspace?.id ?? null;
  const { listRef: stepsRef, onFollowScroll: onStepsScroll } =
    useFollowEnd<HTMLDivElement>({
      resetKey: workspaceId,
      isOn: isRunLive,
    });

  useEffect(() => {
    if (workspaceId === null || stream === null || !isFocused) return;

    Run.focus({ workspaceId, isFocused: true });

    return () => {
      Run.focus({ workspaceId, isFocused: false });
    };
  }, [workspaceId, stream, isFocused]);

  return {
    isFocused,
    canFocus: hasScreen && !isFocused,
    focusLabel: t('DEVICE.FOCUS'),
    focusedText: t('DEVICE.FOCUSED'),
    frameLayoutId: DEVICE.frameLayoutId,
    frameTransition: { duration: MOTION.durationSlow, ease: MOTION.ease },
    onFocus: () => {
      setFocused(true);
    },
    onUnfocus: () => {
      setFocused(false);
    },
    style: {
      '--device-header': `${String(DEVICE.headerHeight)}px`,
      '--device-chrome': `${String(DEVICE.chromeHeight)}px`,
      '--device-ratio': String(screenRatio),
      '--device-steps-min': `${String(DEVICE.stepsMinHeight)}px`,
    } as CSSProperties,
    isPhone,
    hasScreen,
    viewportClassName:
      !hasScreen || isFocused
        ? 'device-view__viewport'
        : isPhone
          ? 'device-view__viewport device-view__viewport--fill'
          : 'device-view__viewport device-view__viewport--browser',
    hasControls: isRunLive,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    hasState: isRunLive,
    stateText: isRunLive ? t('DEVICE.DRIVING') : '',
    offTitle: t('DEVICE.NO_DEVICE'),
    ended:
      lastRun === null || workspace === null
        ? null
        : {
            canWatch: lastRun.video !== null && lastRun.video !== undefined,
            watchLabel: t('DEVICE.WATCH_LAST'),
            runsLabel: t('DEVICE.OPEN_RUNS'),
            onWatch: () => {
              openReplay({
                workspaceId: workspace.id,
                runId: lastRun.id,
                focus: { kind: 'run' },
              });
            },
            onOpenRuns: () => {
              selectRun(lastRun.id);
              selectTab('runs');
            },
          },
    mood: moodOfStatus(workspace?.status ?? null),
    viewports,
    hasViewportPicker: viewports.length > 0 && hasScreen && !isFocused,
    screenRatio,
    onSelectViewport: (viewportId: ViewportId) => {
      if (!workspace || viewportId === viewport.id) return;

      setViewport({ workspaceId: workspace.id, viewportId });

      if (isRunLive) {
        const picked = viewportOf(viewportId);

        Run.resize({
          workspaceId: workspace.id,
          viewport: { width: picked.width, height: picked.height },
        });
      }
    },
    shot,
    stream,
    urlText: shownUrlOf(target?.value ?? ''),
    elapsedLabel: formatElapsed(live?.elapsedSec ?? 0),
    stepsRef,
    onStepsScroll,
    isLive: state === 'driving',
    steps,
    sections: stepSectionsOf(reached),
    hasSteps: isRunLive && reached.length > 0,
    stepsWord: t(isExploring ? 'DEVICE.SCREENS' : 'DEVICE.STEPS'),
    doingLabel:
      isExploring || walked === null
        ? ''
        : t('DEVICE.STEPS_PROGRESS', { done: walked, total: steps.length }),
    onPause,
    onStop,
  };
};
