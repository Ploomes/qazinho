import type { IProSyncProject } from '@/shared/types';

/**
 * O projeto como a plataforma o aceita: o nome, os alvos, os repositórios e as variáveis
 * só pelo nome.
 */
export function projectBodyOf(props: {
  project: IProSyncProject;
  variables: { name: string; description: string }[];
}) {
  const { project, variables } = props;

  return {
    name: project.name,
    targets: project.targets,
    repositories: project.repositories,
    variables: variables.map(({ name, description }) => ({ name, description })),
  };
}
