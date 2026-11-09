import type { IWorkspace } from '@/modules/Workspace/types';
import type { ISavedWorkspace } from '@/shared/types';
import { stringify } from 'yaml';
import { endRun } from './endRun';

/**
 * Texto que um QA consegue ler, screenshots deixados como arquivos; uma run em andamento
 * é guardada como uma que o QAzinho interrompeu, o que ela é se ele fechar agora.
 */
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
          design: bug.design === null ? null : { ...bug.design, src: null },
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
