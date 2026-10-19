import type { IHarnessSection } from '@/harness/context/types';
import type { IChatReference } from '@/shared/types';

/** How the workspace's latest runs went, as a section the agent answers from; nothing before the first run. */
export function describeRuns(runs: IChatReference[]): IHarnessSection {
  return {
    title: 'Runs in this workspace',
    lines: runs.flatMap((run) => [
      `run ${run.id} · ${run.title}`,
      ...run.facts.map((fact) => `  ${fact}`),
    ]),
  };
}
