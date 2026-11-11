import type { CSSProperties } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  currentStepOf,
  planStageOf,
  RUN_HOW_KEYS,
  useDevelopedWatch,
  walkedStepsOf,
} from '@/modules/Run';
import { useWorkspaceMeta } from '@/modules/Workspace/hooks/useWorkspaceMeta';
import {
  NO_CASES,
  WORKSPACE_TABS,
} from '@/modules/Workspace/screens/Workspace/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import { useWorkspaceStore } from '@/store';

export const useWorkspaceViewModel = () => {
  const { t } = useTranslation();
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    name: opened.name,
    issue: opened.issue,
    design: opened.design,
    runStepCount: walkedStepsOf({ plan: opened.plan, caseIds: opened.live?.caseIds })
      .length,
    planCount: opened.plan.length,
    plan: opened.plan,
    bugCount: opened.bugs.filter(({ isDismissed }) => !isDismissed).length,
    walked: opened.live?.outcomes.length ?? 0,
    isExploring: opened.live?.kind === 'explore',
    isLive: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    isAsking: opened.live?.question !== undefined && opened.live.isDone === false,
    how:
      opened.live?.talk === 'checking'
        ? ('check' as const)
        : (opened.live?.how ?? 'replay'),
  }));
  const isLearningUnplanned = useWorkspaceStore(
    (state) =>
      workspace !== null &&
      workspace.planCount === 0 &&
      state.chatDevices[workspace.id] !== undefined,
  );
  const { metaKey, metaCases } = useWorkspaceMeta();
  const developedIds = useWorkspaceStore(
    (state) => state.developedCases[workspace?.id ?? ''] ?? NO_CASES,
  );
  const tab = useWorkspaceStore((state) => state.panelTab);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);
  const setDesign = useWorkspaceStore((state) => state.setDesign);

  useDevelopedWatch();

  const isLive = workspace?.isLive === true;
  const isPaused = workspace?.isPaused === true;
  const isAsking = workspace?.isAsking === true;

  const workspaceId = workspace?.id ?? null;
  const toDevelop = planStageOf({
    plan: workspace?.plan ?? [],
    developed: developedIds,
  }).toDevelop.length;

  const learnedOn = useRef<string | null>(null);
  const hasPlan = (workspace?.planCount ?? 0) > 0;

  useEffect(() => {
    if (isLearningUnplanned) learnedOn.current = workspaceId;

    if (isLive || isLearningUnplanned) selectTab('device');
  }, [workspaceId, isLive, isLearningUnplanned, selectTab]);

  useEffect(() => {
    if (!hasPlan || learnedOn.current !== workspaceId) return;

    learnedOn.current = null;
    selectTab('plan');
  }, [workspaceId, hasPlan, selectTab]);

  return {
    hasWorkspace: workspace !== null,
    style: {
      '--workspace-tabs': `${String(WORKSPACE_TABS.height)}px`,
    } as CSSProperties,
    tab,
    bugCount: workspace?.bugCount ?? 0,
    name: workspace?.name ?? '',
    metaKey,
    metaCases,
    toDevelopLine:
      toDevelop === 0
        ? ''
        : toDevelop === 1
          ? t('WORKSPACE.META_TO_DEVELOP_ONE')
          : t('WORKSPACE.META_TO_DEVELOP_OTHER', { count: toDevelop }),
    issue:
      workspace?.issue === null || workspace?.issue === undefined
        ? null
        : {
            key: workspace.issue.key,
            url: workspace.issue.url,
            title: workspace.issue.title,
          },
    design:
      workspace?.design === null || workspace?.design === undefined
        ? null
        : {
            name: workspace.design.name,
            url: workspace.design.url,
            title: t('WORKSPACE.DESIGN_OPEN'),
          },
    dropDesignLabel: t('WORKSPACE.DESIGN_DROP'),
    liveStatus: isAsking
      ? ('attention' as const)
      : isPaused
        ? ('paused' as const)
        : ('running' as const),
    statusLabel: !isLive
      ? ''
      : workspace?.isExploring === true
        ? t(
            isAsking
              ? 'WORKSPACE.ASKED_EXPLORING'
              : isPaused
                ? 'WORKSPACE.PAUSED_EXPLORING'
                : 'WORKSPACE.LIVE_EXPLORING',
            {
              screens:
                workspace.walked === 1
                  ? t('CHAT.EXPLORE_SCREENS_ONE')
                  : t('CHAT.EXPLORE_SCREENS_OTHER', { count: workspace.walked }),
            },
          )
        : t(
            isAsking
              ? 'WORKSPACE.ASKED_STEP'
              : isPaused
                ? 'WORKSPACE.PAUSED_STEP'
                : 'WORKSPACE.LIVE_STEP',
            {
              doing: t(RUN_HOW_KEYS[workspace?.how ?? 'replay']),
              current: currentStepOf({
                walked: workspace?.walked ?? 0,
                total: workspace?.runStepCount ?? 0,
              }),
              total: workspace?.runStepCount ?? 0,
            },
          ),
    isLive,
    onSelectTab: selectTab,
    onRename: (name: string) => {
      if (workspace) renameWorkspace({ workspaceId: workspace.id, name });
    },
    onDropDesign: () => {
      if (workspace) setDesign({ workspaceId: workspace.id, design: null });
    },
  };
};
