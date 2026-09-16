import type { IProject } from '@/modules/Project/types';
import type { IProcessNode } from '@/modules/Resources/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import type { IProcessSample } from '@/types';
import { RESOURCES } from '@/modules/Resources/constants';
import { rollUp } from './rollUp';

function deviceName(props: { workspace: IWorkspace; samples: IProcessSample[] }): string {
  if (props.workspace.planKind === 'mobile') return RESOURCES.emulatorName;

  const one = props.samples[0]?.name ?? 'Browser';

  return props.samples.length === 1
    ? one
    : `${one} · ${String(props.samples.length)} processes`;
}

function ranBy(props: {
  workspace: IWorkspace;
  samples: IProcessSample[];
}): IProcessNode[] {
  const { workspace, samples } = props;
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
            name: deviceName({ workspace, samples: device }),
            level: 2 as const,
            workspaceId: workspace.id,
            canShutDown: true,
          },
        ]),
  ];
}

/** A project only shows up once something under it is running. Nothing idles in this tree. */
export function buildProcessTree(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
  processes: IProcessSample[];
}): IProcessNode[] {
  const { projects, workspaces, processes } = props;

  return projects.flatMap((project) => {
    const children = workspaces
      .filter((workspace) => workspace.projectId === project.id)
      .flatMap<IProcessNode>((workspace) => {
        const samples = processes.filter(
          ({ workspaceId }) => workspaceId === workspace.id,
        );
        const running = ranBy({ workspace, samples });

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
