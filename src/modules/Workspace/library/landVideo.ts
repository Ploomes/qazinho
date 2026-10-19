import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunVideo } from '@/shared/types';

/** A run's recording, which lands once the run is over: it joins the run it belongs to, and nothing else. */
export function landVideo(props: {
  workspace: IWorkspace;
  runId: string;
  video: IRunVideo;
}): IWorkspace {
  const { workspace, runId, video } = props;

  if (!workspace.runs.some(({ id }) => id === runId)) return workspace;

  return {
    ...workspace,
    runs: workspace.runs.map((run) => (run.id === runId ? { ...run, video } : run)),
  };
}
