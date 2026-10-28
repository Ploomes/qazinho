import type { IProject } from '@/modules/Project/types';
import { issueTargetIn } from './issueTargetIn';
import { repositoriesOf } from './repositoriesOf';
import { webAddressOf } from './webAddressOf';

/**
 * O arquivo no disco é do QA, então qualquer coisa ilegível nele é pulada, não fatal; um
 * endereço web salvo sem esquema lê como um navegador o abre.
 */
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
    .map(({ issueTarget, ...project }) => ({
      ...project,
      ...(issueTargetIn(issueTarget) === undefined
        ? {}
        : { issueTarget: issueTargetIn(issueTarget) }),
      repositories: repositoriesOf(project.repositories),
      targets: project.targets.map((target) =>
        target.kind === 'web'
          ? { ...target, value: webAddressOf(target.value) ?? target.value }
          : target,
      ),
    }));
}
