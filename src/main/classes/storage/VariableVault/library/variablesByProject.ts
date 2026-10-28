import type { IStoredVariable } from '@/main/classes/storage/VariableVault/types';
import type { IProjectVariables } from '@/shared/types';

/**
 * As variáveis guardadas agrupadas por projeto, só por nome e descrição, na ordem em que
 * foram feitas.
 */
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
