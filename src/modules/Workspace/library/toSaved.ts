import type { IWorkspace } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/shared/types';
import { stringify } from 'yaml';
import { endRun } from './endRun';

/** Text a QA can read, screenshots left as files; a run in flight is kept as one QAzinho interrupted, which it is if it closes now. */
export function toSaved(props: { workspace: IWorkspace; at: string }): ISavedWorkspace {
  const workspace = endRun({ ...props, endedBy: 'interrupted' });
  const { plan, ...rest } = workspace;

  return {
    id: workspace.id,
    planYaml: stringify({ cases: plan }),
    json: JSON.stringify(
      {
        ...rest,
        live: null,
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
          sightings: bug.sightings.map((sighting) => ({
            ...sighting,
            shot: { ...sighting.shot, src: null },
          })),
        })),
      },
      null,
      2,
    ),
  };
}
