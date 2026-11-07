import type { IStoredVariable } from '@/main/classes/storage/VariableVault/types';
import type { IProjectVariables } from '@/shared/types';

/**
 * As variáveis guardadas agrupadas por projeto, por nome, descrição e se são segredo, na
 * ordem em que foram feitas.
 */
export function variablesByProject(stored: IStoredVariable[]): IProjectVariables[] {
  const projects: IProjectVariables[] = [];

  for (const { projectId, name, description, isSecret } of stored) {
    const brief = { name, description, isSecret: isSecret ?? true };
    const project = projects.find((one) => one.projectId === projectId);

    if (project === undefined) projects.push({ projectId, variables: [brief] });
    else project.variables.push(brief);
  }

  return projects;
}
