import { useEffect } from 'react';
import { Run } from '@/services';
import { useSettingsStore, useWorkspaceStore } from '@/store';

export const useRunEvents = () => {
  const markDoing = useWorkspaceStore((state) => state.markDoing);
  const markStreaming = useWorkspaceStore((state) => state.markStreaming);
  const landNote = useWorkspaceStore((state) => state.landNote);
  const agent = useSettingsStore((state) => state.agent);
  const landStep = useWorkspaceStore((state) => state.landStep);
  const landRunDone = useWorkspaceStore((state) => state.landRunDone);
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
        else if (event.kind === 'step') landStep(event.outcome);
        else if (event.kind === 'done') landRunDone(event.workspaceId);
        else landRunFailed({ workspaceId: event.workspaceId, text: event.text });
      }),
    [agent, markDoing, markStreaming, landNote, landStep, landRunDone, landRunFailed],
  );

  useEffect(() => {
    if (!isLoaded) return;

    void Run.inFlight().then((runs) => {
      for (const run of runs) resumeRun(run);
    });
  }, [isLoaded, resumeRun]);
};
