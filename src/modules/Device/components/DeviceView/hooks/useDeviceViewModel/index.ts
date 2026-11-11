import type { IDeviceStep, IViewportChoice, ViewportId } from '@/modules/Device/types';
import type { QaReply } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { activityLineOf } from '@/modules/Chat/library';
import { useScreenSwap } from '@/modules/Device/components/DeviceView/hooks/useScreenSwap';
import { DEVICE, VIEWPORTS } from '@/modules/Device/constants';
import {
  deviceStateOf,
  formatElapsed,
  moodOfStatus,
  imageRatioOf,
  lastRunGlanceOf,
  lastRunSayKeyOf,
  shownUrlOf,
  stepSectionsOf,
  stepVerdictsOf,
  viewportOf,
} from '@/modules/Device/library';
import {
  caseVerdict,
  countVerdicts,
  currentStepOf,
  dayLabelOf,
  planStageOf,
  useRunActions,
  RUN_HOW_KEYS,
  runDayOf,
  tallyPartsOf,
  useRunControls,
} from '@/modules/Run';
import { Run } from '@/services';
import { MOTION } from '@/shared/constants';
import { useFollowEnd } from '@/shared/hooks/useFollowEnd';
import { useSelectedWorkspace } from '@/shared/hooks/useSelectedWorkspace';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useDeviceViewModel = () => {
  const { t, i18n } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const workspace = useSelectedWorkspace();
  const setViewport = useWorkspaceStore((state) => state.setViewport);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const openReplay = useAppStore((state) => state.openReplay);
  const openMedia = useAppStore((state) => state.openMedia);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const chatDevices = useWorkspaceStore((state) => state.chatDevices);
  const flashedShot = useWorkspaceStore((state) =>
    workspace === null ? undefined : state.bugFlashes[workspace.id]?.[0]?.shot,
  );
  const isFlashing = useWorkspaceStore((state) =>
    workspace === null
      ? false
      : (state.bugFlashes[workspace.id]?.length ?? 0) > 0 ||
        state.bugFlashesLeaving.includes(workspace.id),
  );
  const clearBugFlashes = useWorkspaceStore((state) => state.clearBugFlashes);
  const activities = useWorkspaceStore((state) => state.activities);
  const developedIds = useWorkspaceStore((state) =>
    workspace === null ? undefined : state.developedCases[workspace.id],
  );
  const { onRunPlan } = useRunActions();
  const {
    runSteps,
    live,
    isLive: isRunLive,
    isPaused,
    onPause,
    onStop,
  } = useRunControls();
  const [isFocusedNow, setFocused] = useState(false);
  const [picked, setPicked] = useState<{ workspaceId: string; id: number } | null>(null);

  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const state = deviceStateOf(workspace);
  const isPhone = workspace?.planKind === 'mobile';
  const viewport = viewportOf(workspace?.viewportId);
  const shot = live?.shot ?? flashedShot ?? null;
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

  const question = live?.isDone === false ? (live.question ?? null) : null;
  const chatDevice = workspace === null ? undefined : chatDevices[workspace.id];
  const isLearning = !isRunLive && chatDevice !== undefined;
  const hasScreen =
    isRunLive || isLearning || isFlashing || (isFocusedNow && shot !== null);
  const isFocused = isFocusedNow && hasScreen;
  const glance =
    lastRun === null || lastRun.kind === 'explore' || hasScreen
      ? null
      : lastRunGlanceOf(lastRun);
  const lastDay =
    lastRun === null
      ? ''
      : dayLabelOf({
          day: runDayOf(lastRun),
          now: new Date(),
          language: i18n.language,
          words: { today: t('DEVICE.TODAY'), yesterday: t('DEVICE.YESTERDAY') },
        });
  const lastRunWhen =
    lastRun === null
      ? ''
      : lastDay === ''
        ? t('DEVICE.LAST_RUN_AT', { at: lastRun.startedAt })
        : t('DEVICE.LAST_RUN_DAY_AT', { day: lastDay, at: lastRun.startedAt });
  const stage = planStageOf({
    plan: workspace?.plan ?? [],
    developed: developedIds ?? [],
  });
  const startLabel =
    stage.toDevelop.length === 0
      ? t('WORKSPACE.RUN_PLAN')
      : stage.developed.length === 0
        ? t('WORKSPACE.DEVELOP_PLAN')
        : t(
            stage.toDevelop.length === 1
              ? 'WORKSPACE.DEVELOP_ONE'
              : 'WORKSPACE.DEVELOP_OTHER',
            { count: stage.toDevelop.length },
          );
  const lastCounts =
    lastRun === null
      ? null
      : countVerdicts(lastRun.cases.map(({ steps }) => caseVerdict(steps)));
  const openLastRun = () => {
    if (lastRun === null) return;

    selectRun(lastRun.id);
    selectTab('runs');
  };
  const openScreens = live?.isDone === false ? (live.screens ?? []) : [];
  const hasRail = openScreens.length > 1;
  const agentScreen = openScreens.find(({ isAgent }) => isAgent) ?? null;
  const pickedScreen = hasRail
    ? (openScreens.find(
        ({ id }) => picked?.workspaceId === workspace?.id && id === picked?.id,
      ) ?? null)
    : null;
  const shownScreen = pickedScreen ?? agentScreen;
  const swap = useScreenSwap({
    shownKey: hasRail ? String(shownScreen?.id ?? '') : 'one',
    isOn: hasRail,
  });
  const stream =
    live?.isDone === false
      ? (pickedScreen?.streamUrl ?? live.streamUrl)
      : (chatDevice?.streamUrl ?? null);
  const viewports: IViewportChoice[] = isPhone
    ? []
    : VIEWPORTS.map((option) => ({
        id: option.id,
        label: t(option.labelKey),
        size: `${String(option.width)} × ${String(option.height)}`,
        isActive: option.id === viewport.id,
      }));
  const workspaceId = workspace?.id ?? null;
  const hasSteps = !isRunLive && isFlashing && reached.length > 0;
  const { listRef: stepsRef, onFollowScroll: onStepsScroll } =
    useFollowEnd<HTMLDivElement>({
      resetKey: workspaceId,
      isOn: hasSteps,
    });

  const doneNow = workspace === null ? [] : (activities[workspace.id] ?? []);
  const activity = doneNow.find(({ tool }) => tool === 'say') ?? doneNow.at(-1);
  const doingNow =
    activity === undefined
      ? null
      : activityLineOf({
          activity,
          hasDesign: workspace?.design !== null,
          say: (key, values) => t(key, values),
        });

  useLayoutEffect(() => {
    if (workspaceId === null) return;

    clearBugFlashes(workspaceId);

    return () => {
      clearBugFlashes(workspaceId);
    };
  }, [workspaceId, clearBugFlashes]);

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
      '--device-rail-width': `${String(DEVICE.railWidth)}px`,
    } as CSSProperties,
    isPhone,
    hasScreen,
    rootClassName: hasRail ? 'device-view device-view--screens' : 'device-view',
    hasRail: hasRail && !isFocused,
    railLabel: t('DEVICE.SCREENS_LABEL'),
    screens: openScreens.map((screen) => {
      const tip = screen.isAgent
        ? t('DEVICE.SCREEN_AGENT_TIP', { id: screen.id })
        : t('DEVICE.SCREEN_TIP', { id: screen.id });

      return {
        id: screen.id,
        streamUrl: screen.streamUrl,
        isAgent: screen.isAgent,
        isShown: screen.id === shownScreen?.id,
        tip:
          screen.account > 1
            ? t('DEVICE.SCREEN_ACCOUNT_TIP', { tip, account: screen.account })
            : tip,
      };
    }),
    stackClassName:
      openScreens.length > 2
        ? 'device-view__browser device-view__browser--stack device-view__browser--stack-deep'
        : hasRail
          ? 'device-view__browser device-view__browser--stack'
          : 'device-view__browser',
    swap,
    pickedNotice:
      pickedScreen !== null && !pickedScreen.isAgent
        ? t('DEVICE.SCREEN_PICKED', { id: pickedScreen.id })
        : null,
    onPickScreen: (id: number) => {
      if (workspace === null) return;

      setPicked(id === agentScreen?.id ? null : { workspaceId: workspace.id, id });
    },
    onFollowAgent: () => {
      setPicked(null);
    },
    viewportClassName: isFocused
      ? 'device-view__viewport'
      : isPhone
        ? 'device-view__viewport device-view__viewport--fill'
        : 'device-view__viewport device-view__viewport--browser',
    hasControls: isRunLive,
    pauseLabel: isPaused ? t('COMMON.RESUME') : t('COMMON.PAUSE'),
    hasState: isRunLive || isLearning,
    stateText: isRunLive
      ? t(RUN_HOW_KEYS[live?.talk === 'checking' ? 'check' : (live?.how ?? 'replay')])
      : isLearning
        ? t('DEVICE.LEARNING')
        : '',
    offTitle:
      lastRun === null
        ? t('DEVICE.NO_DEVICE')
        : t(lastRun.kind === 'explore' ? 'DEVICE.ENDED_EXPLORE' : 'DEVICE.ENDED', {
            id: lastRun.id,
          }),
    offDetail:
      lastRun === null
        ? ''
        : tallyPartsOf({
            ...countVerdicts(lastRun.cases.map(({ steps }) => caseVerdict(steps))),
            say: (key, values) => t(key, values),
          }).join(', '),
    start:
      lastRun !== null || workspace === null || workspace.plan.length === 0
        ? null
        : { label: startLabel, onStart: onRunPlan },
    offMood:
      lastRun === null ? ('sleeping' as const) : moodOfStatus(workspace?.status ?? null),
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
    lastShot:
      glance?.shot == null || lastRun === null
        ? null
        : {
            label: t('RUN.STEP_SHOT', {
              id: glance.shot.caseId,
              number: glance.shot.number,
            }),
            src: glance.shot.src,
            file: glance.shot.file,
            onOpen: () => {
              if (glance.shot === null) return;

              openMedia({
                kicker: lastRun.id,
                title: t('RUN.STEP_SHOT', {
                  id: glance.shot.caseId,
                  number: glance.shot.number,
                }),
                src: glance.shot.src,
                file: glance.shot.file,
              });
            },
          },
    lastRun:
      glance?.shot == null ||
      lastRun === null ||
      workspace === null ||
      lastCounts === null
        ? null
        : {
            caption: t(glance.shot.isBad ? 'DEVICE.SHOT_FAILED' : 'DEVICE.SHOT_END', {
              id: glance.shot.caseId,
              number: glance.shot.number,
            }),
            sayKey: lastRunSayKeyOf({
              failed: lastCounts.failed + lastCounts.blocked,
              passed: lastCounts.passed,
            }),
            sayValues: {
              when: lastRunWhen,
              failed: t('DEVICE.LAST_RUN_FAILED', {
                count: lastCounts.failed + lastCounts.blocked,
              }),
              passed: t('DEVICE.LAST_RUN_PASSED', { count: lastCounts.passed }),
              time: formatElapsed(lastRun.durationSec),
            },
            runsLabel: t('DEVICE.OPEN_RUN'),
            canWatch: lastRun.video !== null && lastRun.video !== undefined,
            watchLabel: t('DEVICE.WATCH'),
            onOpenRuns: openLastRun,
            onWatch: () => {
              openReplay({
                workspaceId: workspace.id,
                runId: lastRun.id,
                focus: { kind: 'run' },
              });
            },
            cases: glance.failed.map((item) => ({
              key: item.id,
              id: item.id,
              title: item.title,
              linkLabel: item.bugId ?? t('DEVICE.OPEN_RUNS'),
              onOpen: () => {
                if (item.bugId === null) {
                  openLastRun();

                  return;
                }

                if (openBugId !== item.bugId) toggleBug(item.bugId);

                selectTab('bugs');
              },
            })),
          },
    mood: moodOfStatus(workspace?.status ?? null),
    viewports,
    hasViewportPicker: viewports.length > 0 && hasScreen && !isFocused && !isLearning,
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
    urlText: shownUrlOf(
      (isLearning
        ? chatDevice?.address
        : hasScreen
          ? (pickedScreen?.url ?? live?.address)
          : undefined) ??
        target?.value ??
        '',
    ),
    elapsedLabel: formatElapsed(live?.elapsedSec ?? 0),
    stepsRef,
    onStepsScroll,
    isLive: state === 'driving',
    doingNow,
    hasCaption: isRunLive && doingNow !== null,
    caption: doingNow?.text ?? '',
    steps,
    sections: stepSectionsOf(reached),
    hasSteps,
    stepsWord: t(isExploring ? 'DEVICE.SCREENS' : 'DEVICE.STEPS'),
    doingLabel:
      isExploring || walked === null
        ? ''
        : t('DEVICE.STEPS_PROGRESS', {
            current: currentStepOf({ walked, total: steps.length }),
            total: steps.length,
          }),
    onPause,
    onStop,
    question:
      question === null
        ? null
        : { key: `${live?.id ?? ''}/${question.id}`, live: question },
    onAnswerQuestion: (reply: QaReply) => {
      if (workspace !== null && question !== null)
        Run.answer({ workspaceId: workspace.id, questionId: question.id, reply });
    },
  };
};
