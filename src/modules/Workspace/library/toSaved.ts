import type { IWorkspace } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/shared/types';
import { stringify } from 'yaml';

/** Screenshots stay on disk as files, so what is written here is text a QA can read. */
export function toSaved(workspace: IWorkspace): ISavedWorkspace {
  const { plan, live, ...rest } = workspace;

  return {
    id: workspace.id,
    planYaml: stringify({ cases: plan }),
    json: JSON.stringify(
      {
        ...rest,
        live: null,
        status: live?.isRunning === true ? 'idle' : rest.status,
        runs: rest.runs.map((run) => ({
          ...run,
          cases: run.cases.map((runCase) => ({
            ...runCase,
            steps: runCase.steps.map((step) => ({ ...step, shot: null })),
          })),
        })),
        bugs: rest.bugs.map((bug) => ({
          ...bug,
          shots: bug.shots.map((shot) => ({ ...shot, src: null })),
        })),
      },
      null,
      2,
    ),
  };
}
