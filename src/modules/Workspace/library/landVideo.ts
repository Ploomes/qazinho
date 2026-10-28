import type { IWorkspace } from '@/modules/Workspace/types';
import type { IRunVideo } from '@/shared/types';

/**
 * A gravação de uma run, que chega depois que a run acaba: entra na run a que pertence, e
 * em nada mais.
 */
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
