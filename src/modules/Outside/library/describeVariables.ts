import type { IProject } from '@/modules/Project';
import type { IVariableBrief } from '@/shared/types';

/** As variáveis de um projeto para um agente de fora: nome e descrição, sem valor. */
export function describeVariables(props: {
  project: IProject;
  variables: IVariableBrief[];
}): string {
  const { project, variables } = props;
  const named = `${project.id} "${project.name}"`;

  if (variables.length === 0)
    return `${named} keeps no variables yet. Add one with ask_variables: the user types its value in QAzinho.`;

  return [
    `${named} keeps these variables; a step names one as \${NAME}, and its value never leaves QAzinho:`,
    ...variables.map(
      ({ name, description }) =>
        `  \${${name}}${description === '' ? '' : ` · ${description}`}`,
    ),
  ].join('\n');
}
