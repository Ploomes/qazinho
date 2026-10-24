import type { IProSyncProject } from '@/shared/types';

/** The project as the platform takes it: its name, targets, repositories and its variables by name alone. */
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
