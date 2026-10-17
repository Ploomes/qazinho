import type { IProcessNode } from '@/modules/Resources';
import { useTranslation } from 'react-i18next';
import { MB_IN_GB, buildProcessTree, rollUp } from '@/modules/Resources';
import { Run } from '@/services';
import { useDismiss } from '@/shared/hooks';
import { useAppStore, useMachineStore, useWorkspaceStore } from '@/store';

export const useResourcePopoverViewModel = () => {
  const { t } = useTranslation();
  const isOpen = useAppStore((state) => state.isResourcesOpen);
  const projects = useAppStore((state) => state.projects);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const resources = useMachineStore((state) => state.resources);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const ref = useDismiss<HTMLDivElement>(toggleResources);

  const app = resources.processes.filter(({ kind }) => kind === 'app');

  const itself: IProcessNode = {
    ...rollUp(app),
    id: 'qazinho',
    name: `QAzinho · ${String(app.length)} processes`,
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
    ref,
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
