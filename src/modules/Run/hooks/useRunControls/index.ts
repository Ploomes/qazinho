import { useTranslation } from 'react-i18next';
import { flattenPlanSteps } from '@/modules/Run/library';
import { Run } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

/** Run, hold and stop: the machine and the page are told in the same breath, from one place. */
export const useRunControls = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const detected = useMachineStore((state) => state.agents);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const start = useWorkspaceStore((state) => state.startRun);
  const pause = useWorkspaceStore((state) => state.pauseRun);
  const stop = useWorkspaceStore((state) => state.stopRun);
  const landRunFailed = useWorkspaceStore((state) => state.landRunFailed);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const steps = flattenPlanSteps(workspace?.plan ?? []);
  const live = workspace?.live ?? null;
  const isLive = live !== null && !live.isDone;

  const onRun = () => {
    if (!workspace || steps.length === 0 || isLive) return;

    const runId = `r-${String(workspace.runs.length + 1).padStart(2, '0')}`;

    start({ workspaceId: workspace.id, runId });

    if (target === null || target.kind === 'ios') {
      landRunFailed({ workspaceId: workspace.id, text: t('RUN.NO_IOS_TARGET') });

      return;
    }

    Run.start({
      workspaceId: workspace.id,
      agentId: detected.find(({ name }) => name === agentName)?.id ?? 'claude-code',
      model,
      sessionId: workspace.sessionId,
      target: { kind: target.kind, value: target.value },
      runId,
      steps,
    });
  };

  const onPause = () => {
    if (!workspace?.live) return;

    pause(workspace.id);
    Run.setPaused({ workspaceId: workspace.id, isPaused: workspace.live.isRunning });
  };

  const onStop = () => {
    if (!workspace) return;

    stop(workspace.id);
    Run.stop(workspace.id);
  };

  return {
    steps,
    live,
    isLive,
    isPaused: live !== null && !live.isRunning && !live.isDone,
    canRun: steps.length > 0 && !isLive,
    onRun,
    onPause,
    onStop,
  };
};
