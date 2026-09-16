import type { IProject } from '@/modules/Project/types';
import type { IProcessNode } from '@/modules/Resources/types';
import type { IWorkspace } from '@/modules/Workspace/types';
import { deviceStateOf } from '@/modules/Device/library';
import { RESOURCES } from '@/modules/Resources/constants';

/** A project only shows up once something under it is running. Nothing idles in this tree. */
export function buildProcessTree(props: {
  projects: IProject[];
  workspaces: IWorkspace[];
}): IProcessNode[] {
  const { projects, workspaces } = props;

  return projects.flatMap((project) => {
    const running = workspaces.filter(
      (workspace) =>
        workspace.projectId === project.id && deviceStateOf(workspace) !== 'off',
    );

    if (running.length === 0) return [];

    const children = running.flatMap<IProcessNode>((workspace) => {
      const device =
        workspace.planKind === 'mobile' ? RESOURCES.emulator : RESOURCES.browser;

      return [
        {
          id: workspace.id,
          name: workspace.name,
          level: 1,
          cpu: RESOURCES.agent.cpu + device.cpu,
          ramGb: RESOURCES.agent.ramGb + device.ramGb,
          canShutDown: false,
        },
        {
          id: `${workspace.id}-agent`,
          name: 'Claude Code · 96% context',
          level: 2,
          cpu: RESOURCES.agent.cpu,
          ramGb: RESOURCES.agent.ramGb,
          canShutDown: false,
        },
        {
          id: `${workspace.id}-device`,
          name:
            workspace.planKind === 'mobile'
              ? 'Emulator · Pixel 7 · API 34'
              : 'Chromium 1280 × 800',
          level: 2,
          cpu: device.cpu,
          ramGb: device.ramGb,
          canShutDown: true,
        },
      ];
    });

    const owned = children.filter(({ level }) => level === 1);

    return [
      {
        id: project.id,
        name: project.name,
        level: 0,
        cpu: owned.reduce((total, node) => total + node.cpu, 0),
        ramGb: owned.reduce((total, node) => total + node.ramGb, 0),
        canShutDown: false,
      },
      ...children,
    ];
  });
}
