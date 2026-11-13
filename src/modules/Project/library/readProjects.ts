import type { IProject } from '@/modules/Project/types';
import { issueTargetIn } from './issueTargetIn';
import { repositoriesOf } from './repositoriesOf';
import { templatesIn } from './templatesIn';
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
    .map(
      ({
        issueTarget,
        readyColumn,
        readyStatuses,
        templates,
        isNamePending,
        ...project
      }) => ({
        ...project,
        ...(isNamePending === true ? { isNamePending } : {}),
        ...(issueTargetIn(issueTarget) === undefined
          ? {}
          : { issueTarget: issueTargetIn(issueTarget) }),
        ...(Array.isArray(readyStatuses) &&
        readyStatuses.length > 0 &&
        readyStatuses.every((status) => typeof status === 'string')
          ? { readyStatuses }
          : {}),
        ...(templatesIn(templates) === null
          ? {}
          : { templates: templatesIn(templates) ?? {} }),
        ...(typeof readyColumn?.boardId === 'number' &&
        typeof readyColumn.board === 'string' &&
        typeof readyColumn.column === 'string'
          ? { readyColumn }
          : {}),
        repositories: repositoriesOf(project.repositories),
        targets: project.targets.map((target) =>
          target.kind === 'web'
            ? { ...target, value: webAddressOf(target.value) ?? target.value }
            : target,
        ),
      }),
    );
}
