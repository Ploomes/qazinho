import type { RunMode } from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { knownBugsOf } from '@/modules/Bug/library';
import { viewportOf } from '@/modules/Device/library';
import { flattenPlanSteps, nextRunId, walkedByOf } from '@/modules/Run/library';
import { Run } from '@/services';
import { EXPLORATION } from '@/shared/constants';
import {
  useAppStore,
  useMachineStore,
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

  const runWorkspace = (
    workspaceId: string | null,
    mode: RunMode = 'replay',
  ): string | null => {
    const { workspace, target } = opened(workspaceId);
    const isExploring = mode === 'explore';
    const steps = isExploring ? [] : flattenPlanSteps(workspace?.plan ?? []);
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
      language: useSettingsStore.getState().language,
      viewport: { width: viewport.width, height: viewport.height },
      pixelRatio: window.devicePixelRatio,
      mode,
      ...(isExploring ? { minutes: EXPLORATION.minutes } : {}),
      bugs: knownBugsOf(workspace.bugs),
    });

    return runId;
  };

  const stopWorkspace = (workspaceId: string | null): void => {
    const { workspace } = opened(workspaceId);

    if (!workspace?.live || workspace.live.isDone) return;

    stop(workspace.id);
    Run.stop(workspace.id);
  };

  return {
    runWorkspace,
    stopWorkspace,
    onRun: () => {
      runWorkspace(selectedId());
    },
    onRunWithAgent: () => {
      runWorkspace(selectedId(), 'agent');
    },
    onExplore: () => {
      runWorkspace(selectedId(), 'explore');
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
