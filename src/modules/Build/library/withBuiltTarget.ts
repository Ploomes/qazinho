import type { IProject } from '@/modules/Project/types';
import type { BuildPlatform } from '@/shared/types';

/** A project with a build as its target on that platform, in the place of the one it had, or added after the others. */
export function withBuiltTarget(props: {
  project: IProject;
  platform: BuildPlatform;
  artifact: string;
  label: string;
}): IProject {
  const { project, platform, artifact, label } = props;
  const kept = project.targets.find(({ kind }) => kind === platform);

  return {
    ...project,
    targets:
      kept === undefined
        ? [
            ...project.targets,
            { id: `t-${platform}`, kind: platform, label, value: artifact },
          ]
        : project.targets.map((target) =>
            target.id === kept.id ? { ...target, value: artifact } : target,
          ),
  };
}
