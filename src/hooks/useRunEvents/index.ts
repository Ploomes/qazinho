import { useEffect } from 'react';
import { Run } from '@/services';
import { useWorkspaceStore } from '@/store';

/** The one place a run on the machine becomes state the page can draw. */
export const useRunEvents = () => {
  const markDoing = useWorkspaceStore((state) => state.markDoing);
  const markStreaming = useWorkspaceStore((state) => state.markStreaming);
  const landStep = useWorkspaceStore((state) => state.landStep);
  const landRunDone = useWorkspaceStore((state) => state.landRunDone);
  const landRunFailed = useWorkspaceStore((state) => state.landRunFailed);

  useEffect(
    () =>
      Run.onEvent((event) => {
        if (event.kind === 'doing')
          markDoing({ workspaceId: event.workspaceId, index: event.index });
        else if (event.kind === 'streaming')
          markStreaming({ workspaceId: event.workspaceId, url: event.url });
        else if (event.kind === 'step') landStep(event.outcome);
        else if (event.kind === 'done') landRunDone(event.workspaceId);
        else landRunFailed({ workspaceId: event.workspaceId, text: event.text });
      }),
    [markDoing, markStreaming, landStep, landRunDone, landRunFailed],
  );
};
