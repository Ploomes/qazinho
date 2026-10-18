import { useTranslation } from 'react-i18next';
import { viewportOf } from '@/modules/Device/library';
import { flattenPlanSteps } from '@/modules/Run/library';
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

      const runId = `r-${String(workspace.runs.length + 1).padStart(2, '0')}`;

      start({ workspaceId: workspace.id, runId });

      if (target === null || target.kind === 'ios') {
        landRunFailed({ workspaceId: workspace.id, text: t('RUN.NO_IOS_TARGET') });

        return;
      }

      const { agent, model } = useSettingsStore.getState();
      const viewport = viewportOf(workspace.viewportId);

      Run.start({
        workspaceId: workspace.id,
        agentId:
          useMachineStore.getState().agents.find(({ name }) => name === agent)?.id ??
          'claude-code',
        model,
        target: { kind: target.kind, value: target.value },
        runId,
        steps,
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
