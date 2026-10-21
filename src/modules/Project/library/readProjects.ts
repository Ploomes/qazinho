import type { IProject } from '@/modules/Project/types';
import { repositoriesOf } from './repositoriesOf';
import { webAddressOf } from './webAddressOf';

/** The file on disk belongs to the QA, so anything unreadable in it is skipped, not fatal; a web address saved with no scheme reads as a browser opens it. */
export function readProjects(json: string): IProject[] {
  let read: unknown;

  try {
    read = JSON.parse(json);
  } catch {
    return [];
  }

  if (!Array.isArray(read)) return [];

  return read
    .filter(
      (one): one is IProject =>
        typeof one === 'object' &&
        one !== null &&
        typeof (one as IProject).id === 'string' &&
        Array.isArray((one as IProject).targets),
    )
    .map((project) => ({
      ...project,
      repositories: repositoriesOf(project.repositories),
      targets: project.targets.map((target) =>
        target.kind === 'web'
          ? { ...target, value: webAddressOf(target.value) ?? target.value }
          : target,
      ),
    }));
}
