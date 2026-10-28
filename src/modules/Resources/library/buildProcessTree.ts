import type { IProject } from '@/modules/Project';
import type { IProcessNode } from '@/modules/Resources/types';
import type { IWorkspace } from '@/modules/Workspace';
import type { IProcessSample } from '@/shared/types';
import { rollUp } from './rollUp';

type Named = (props: { name: string; count: number }) => string;

/**
 * Um projeto só aparece quando algo sob ele está rodando; `named` dá palavras a uma linha
 * que soma vários processos.
 */
export function buildProcessTree(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  processes: IProcessSample[];
  named: Named;
}): IProcessNode[] {
  const { projects, workspaces, processes, named } = props;

  return projects.flatMap((project) => {
    const children = workspaces
      .filter((workspace) => workspace.projectId === project.id)
      .flatMap<IProcessNode>((workspace) => {
        const samples = processes.filter(
          ({ workspaceId }) => workspaceId === workspace.id,
        );
        const running = ranBy({ workspace, samples, named });

        if (running.length === 0) return [];

        return [
          {
            ...rollUp(samples),
            id: workspace.id,
            name: workspace.name,
            level: 1,
            workspaceId: workspace.id,
            canShutDown: false,
          },
          ...running,
        ];
      });

    if (children.length === 0) return [];

    const owned = children.filter(({ level }) => level === 1);

    return [
      {
        id: project.id,
        name: project.name,
        level: 0,
        cpu: Math.round(owned.reduce((total, node) => total + node.cpu, 0) * 10) / 10,
        ramGb:
          Math.round(owned.reduce((total, node) => total + node.ramGb, 0) * 100) / 100,
        workspaceId: null,
        canShutDown: false,
      },
      ...children,
    ];
  });
}

function ranBy(props: {
  workspace: IWorkspace;
  samples: IProcessSample[];
  named: Named;
}): IProcessNode[] {
  const { workspace, samples, named } = props;
  const agent = samples.filter(({ kind }) => kind === 'agent');
  const device = samples.filter(({ kind }) => kind === 'device');

  return [
    ...(agent.length === 0
      ? []
      : [
          {
            ...rollUp(agent),
            id: `${workspace.id}-agent`,
            level: 2 as const,
            workspaceId: workspace.id,
            canShutDown: false,
          },
        ]),
    ...(device.length === 0
      ? []
      : [
          {
            ...rollUp(device),
            id: `${workspace.id}-device`,
            name: named({ name: device[0]?.name ?? '', count: device.length }),
            level: 2 as const,
            workspaceId: workspace.id,
            canShutDown: true,
          },
        ]),
  ];
}
