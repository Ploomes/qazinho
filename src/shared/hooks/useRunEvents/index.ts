import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RUN_FAILURE_KEYS } from '@/modules/Run/constants';
import { walkedByOf } from '@/modules/Run/library';
import { Run } from '@/services';
import { useMachineStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useRunEvents = () => {
  const { t } = useTranslation();
  const markDoing = useWorkspaceStore((state) => state.markDoing);
  const markStreaming = useWorkspaceStore((state) => state.markStreaming);
  const landNote = useWorkspaceStore((state) => state.landNote);
  const landCost = useWorkspaceStore((state) => state.landCost);
  const landFinding = useWorkspaceStore((state) => state.landFinding);
  const agent = useSettingsStore((state) => state.agent);
  const landStep = useWorkspaceStore((state) => state.landStep);
  const landRunDone = useWorkspaceStore((state) => state.landRunDone);
  const landVideo = useWorkspaceStore((state) => state.landVideo);
  const landRunFailed = useWorkspaceStore((state) => state.landRunFailed);
  const resumeRun = useWorkspaceStore((state) => state.resumeRun);
  const isLoaded = useWorkspaceStore((state) => state.isLoaded);

  useEffect(
    () =>
      Run.onEvent((event) => {
        if (event.kind === 'doing')
          markDoing({ workspaceId: event.workspaceId, index: event.index });
        else if (event.kind === 'streaming')
          markStreaming({ workspaceId: event.workspaceId, url: event.url });
        else if (event.kind === 'note')
          landNote({ workspaceId: event.workspaceId, text: event.text, who: agent });
        else if (event.kind === 'cost')
          landCost({ workspaceId: event.workspaceId, costUsd: event.costUsd });
        else if (event.kind === 'finding')
          landFinding({ workspaceId: event.workspaceId, finding: event.finding });
        else if (event.kind === 'step') landStep(event.outcome);
        else if (event.kind === 'done') landRunDone(event.workspaceId);
        else if (event.kind === 'video')
          landVideo({
            workspaceId: event.workspaceId,
            runId: event.runId,
            video: event.video,
          });
        else
          landRunFailed({
            workspaceId: event.workspaceId,
            text: t(RUN_FAILURE_KEYS[event.failure.reason], { ...event.failure, agent }),
          });
      }),
    [
      agent,
      t,
      markDoing,
      markStreaming,
      landNote,
      landCost,
      landFinding,
      landStep,
      landRunDone,
      landVideo,
      landRunFailed,
    ],
  );

  useEffect(() => {
    if (!isLoaded) return;

    void Run.inFlight().then((runs) => {
      const { agents } = useMachineStore.getState();
      const { agent } = useSettingsStore.getState();

      for (const run of runs)
        resumeRun({
          run,
          by: walkedByOf({
            agent: agents.find(({ id }) => id === run.agentId)?.name ?? agent,
            model: run.model,
            targetKind: run.targetKind,
            agents,
          }),
        });
    });
  }, [isLoaded, resumeRun]);
};
