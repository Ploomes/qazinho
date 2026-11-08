import type { RunMode } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { knownBugsOf } from '@/modules/Bug/library';
import { viewportOf } from '@/modules/Device/library';
import { memoriesFor } from '@/modules/Memory/library';
import {
  flattenPlanSteps,
  nextRunId,
  planStageOf,
  walkedByOf,
  walkedStepsOf,
} from '@/modules/Run/library';
import { Run } from '@/services';
import { EXPLORATION } from '@/shared/constants';
import {
  useAppStore,
  useMachineStore,
  useProStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

export const useRunActions = () => {
  const { t } = useTranslation();
  const start = useWorkspaceStore((state) => state.startRun);
  const pause = useWorkspaceStore((state) => state.pauseRun);
  const stop = useWorkspaceStore((state) => state.stopRun);
  const landRunFailed = useWorkspaceStore((state) => state.landRunFailed);

  const opened = (workspaceId: string | null) => {
    const { projects } = useAppStore.getState();
    const workspace =
      useWorkspaceStore.getState().workspaces.find(({ id }) => id === workspaceId) ??
      null;
    const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;

    return {
      workspace,
      target: project?.targets.find(({ id }) => id === workspace?.targetId) ?? null,
    };
  };

  const selectedId = () => useAppStore.getState().selectedWorkspaceId;

  const begin = (props: {
    workspaceId: string | null;
    mode: RunMode;
    caseIds?: string[];
  }): string | null => {
    const { workspaceId, mode, caseIds } = props;
    const { workspace, target } = opened(workspaceId);
    const isExploring = mode === 'explore';
    const scoped = caseIds === undefined || caseIds.length === 0 ? undefined : caseIds;
    const steps = isExploring
      ? []
      : walkedStepsOf({ plan: workspace?.plan ?? [], caseIds: scoped });
    const live = workspace?.live ?? null;

    if (
      !workspace ||
      (steps.length === 0 && !isExploring) ||
      (live !== null && !live.isDone)
    )
      return null;

    const runId = nextRunId(workspace);
    const { agent, model } = useSettingsStore.getState();
    const { agents } = useMachineStore.getState();

    start({
      workspaceId: workspace.id,
      runId,
      by: walkedByOf({ agent, model, targetKind: target?.kind ?? 'web', agents }),
      ...(isExploring ? { kind: 'explore' as const } : {}),
      ...(scoped === undefined ? {} : { caseIds: scoped }),
    });

    if (target === null) {
      landRunFailed({ workspaceId: workspace.id, text: t('RUN.NO_TARGET') });

      return runId;
    }

    const viewport = viewportOf(workspace.viewportId);

    Run.start({
      workspaceId: workspace.id,
      projectId: workspace.projectId,
      agentId: agents.find(({ name }) => name === agent)?.id ?? 'claude-code',
      model,
      target: { kind: target.kind, value: target.value },
      runId,
      steps,
      ...(scoped === undefined ? {} : { caseIds: scoped }),
      ...(isExploring ? { plan: flattenPlanSteps(workspace.plan) } : {}),
      language: useSettingsStore.getState().language,
      viewport: { width: viewport.width, height: viewport.height },
      pixelRatio: window.devicePixelRatio,
      mode,
      ...(isExploring ? { minutes: EXPLORATION.minutes } : {}),
      bugs: knownBugsOf(workspace.bugs),
      design: workspace.design,
      memories: memoriesFor({
        memories: useAppStore
          .getState()
          .projects.find(({ id }) => id === workspace.projectId)?.memories,
        workspaceId: workspace.id,
        targetKind: target.kind,
      }),
    });

    return runId;
  };

  const runWorkspace = (workspaceId: string | null, mode: RunMode = 'replay') =>
    begin({ workspaceId, mode });

  const hasOrgUpdate = (workspaceId: string | null): boolean => {
    const { workspace } = opened(workspaceId);

    return useProStore
      .getState()
      .shares.some(
        ({ projectId, conflicts }) =>
          projectId === workspace?.projectId &&
          conflicts.some((conflict) => conflict.workspaceId === workspace.id),
      );
  };

  const runOwn = (mode: RunMode, caseIds?: string[]): void => {
    const workspaceId = selectedId();

    if (workspaceId !== null && hasOrgUpdate(workspaceId)) {
      useProStore
        .getState()
        .holdRun({ workspaceId, mode, ...(caseIds === undefined ? {} : { caseIds }) });

      return;
    }

    begin({ workspaceId, mode, ...(caseIds === undefined ? {} : { caseIds }) });
  };

  const stageOfSelected = () => {
    const { workspace } = opened(selectedId());

    return planStageOf({
      plan: workspace?.plan ?? [],
      developed: useWorkspaceStore.getState().developedCases[workspace?.id ?? ''] ?? [],
    });
  };

  const stopWorkspace = (workspaceId: string | null): void => {
    const { workspace } = opened(workspaceId);

    if (!workspace?.live || workspace.live.isDone) return;

    stop(workspace.id);
    Run.stop(workspace.id);
  };

  return {
    runWorkspace,
    beginRun: begin,
    runCases: (props: { workspaceId: string | null; caseIds: string[] }) =>
      begin({ ...props, mode: 'replay' }),
    stopWorkspace,
    onRun: () => {
      const { developed, toDevelop } = stageOfSelected();

      runOwn('replay', developed.length === 0 ? undefined : toDevelop);
    },
    onRunDeveloped: () => {
      runOwn('replay', stageOfSelected().developed);
    },
    onRunWithAgent: () => {
      runOwn('agent');
    },
    onExplore: () => {
      runOwn('explore');
    },
    onRunCase: (caseId: string) => {
      runOwn('replay', [caseId]);
    },
    onPause: () => {
      const { workspace } = opened(selectedId());

      if (!workspace?.live) return;

      pause(workspace.id);
      Run.setPaused({ workspaceId: workspace.id, isPaused: workspace.live.isRunning });
    },
    onStop: () => {
      stopWorkspace(selectedId());
    },
  };
};
