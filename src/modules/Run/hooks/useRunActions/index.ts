import { useTranslation } from 'react-i18next';
import { viewportOf } from '@/modules/Device/library';
import { flattenPlanSteps, nextRunId, walkedByOf } from '@/modules/Run/library';
import { Run } from '@/services';
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

  const opened = () => {
    const { projects, selectedWorkspaceId } = useAppStore.getState();
    const workspace =
      useWorkspaceStore
        .getState()
        .workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
    const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;

    return {
      workspace,
      target: project?.targets.find(({ id }) => id === workspace?.targetId) ?? null,
    };
  };

  return {
    onRun: () => {
      const { workspace, target } = opened();
      const steps = flattenPlanSteps(workspace?.plan ?? []);
      const live = workspace?.live ?? null;

      if (!workspace || steps.length === 0 || (live !== null && !live.isDone)) return;

      const runId = nextRunId(workspace);
      const { agent, model } = useSettingsStore.getState();
      const { agents } = useMachineStore.getState();

      start({
        workspaceId: workspace.id,
        runId,
        by: walkedByOf({ agent, model, targetKind: target?.kind ?? 'web', agents }),
      });

      if (target === null) {
        landRunFailed({ workspaceId: workspace.id, text: t('RUN.NO_TARGET') });

        return;
      }

      const viewport = viewportOf(workspace.viewportId);

      Run.start({
        workspaceId: workspace.id,
        agentId: agents.find(({ name }) => name === agent)?.id ?? 'claude-code',
        model,
        target: { kind: target.kind, value: target.value },
        runId,
        steps,
        language: useSettingsStore.getState().language,
        viewport: { width: viewport.width, height: viewport.height },
        pixelRatio: window.devicePixelRatio,
      });
    },
    onPause: () => {
      const { workspace } = opened();

      if (!workspace?.live) return;

      pause(workspace.id);
      Run.setPaused({ workspaceId: workspace.id, isPaused: workspace.live.isRunning });
    },
    onStop: () => {
      const { workspace } = opened();

      if (!workspace?.live || workspace.live.isDone) return;

      stop(workspace.id);
      Run.stop(workspace.id);
    },
  };
};
