import type { IStoredVariable } from '@/main/classes/storage/VariableVault/types';
import type { IProjectVariables } from '@/shared/types';

/** The stored variables grouped by project, by name and description only, in the order they were made. */
export function variablesByProject(stored: IStoredVariable[]): IProjectVariables[] {
  const projects: IProjectVariables[] = [];

  for (const { projectId, name, description } of stored) {
    const project = projects.find((one) => one.projectId === projectId);

    if (project === undefined)
      projects.push({ projectId, variables: [{ name, description }] });
    else project.variables.push({ name, description });
  }

  return projects;
}
