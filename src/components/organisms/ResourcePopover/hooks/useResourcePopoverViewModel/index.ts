import type { IProcessNode } from '@/modules/Resources/types';
import { useTranslation } from 'react-i18next';
import { buildProcessTree, rollUp } from '@/modules/Resources/library';
import { Run } from '@/services';
import { useAppStore, useMachineStore, useWorkspaceStore } from '@/store';

const MB_IN_GB = 1024;

export const useResourcePopoverViewModel = () => {
  const { t } = useTranslation();
  const isOpen = useAppStore((state) => state.isResourcesOpen);
  const projects = useAppStore((state) => state.projects);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const resources = useMachineStore((state) => state.resources);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const app = resources.processes.filter(({ kind }) => kind === 'app');

  const itself: IProcessNode = {
    ...rollUp(app),
    id: 'gocrash',
    name: `gocrash · ${String(app.length)} processes`,
    level: 0,
    workspaceId: null,
    canShutDown: false,
  };

  const running = buildProcessTree({
    projects,
    workspaces,
    processes: resources.processes,
  });

  return {
    isOpen,
    nodes: app.length === 0 ? running : [itself, ...running],
    header:
      resources.processes.length === 0
        ? t('RESOURCES.NOTHING_RUNNING')
        : t('RESOURCES.RUNNING', {
            count: resources.processes.length,
            ram: (resources.ramMb / MB_IN_GB).toFixed(1),
          }),
    onClose: toggleResources,
    onShutDown: (workspaceId: string) => {
      stopRun(workspaceId);
      Run.stop(workspaceId);
    },
  };
};
