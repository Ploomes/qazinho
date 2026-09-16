import { useTranslation } from 'react-i18next';
import { RESOURCES } from '@/modules/Resources/constants';
import { buildProcessTree } from '@/modules/Resources/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useResourcePopoverViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const isOpen = useAppStore((state) => state.isResourcesOpen);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const stopRun = useWorkspaceStore((state) => state.stopRun);

  const nodes = buildProcessTree({ projects, workspaces });
  const running = nodes.filter(({ level }) => level === 1);
  const ramGb = running.reduce((total, node) => total + node.ramGb, 0);
  const cpu = running.reduce((total, node) => total + node.cpu, 0);

  return {
    isOpen,
    nodes,
    cpu,
    ramGb,
    ramCeilingGb: RESOURCES.ramCeilingGb,
    processCount: nodes.filter(({ level }) => level === 2).length,
    header:
      running.length === 0
        ? t('RESOURCES.NOTHING_RUNNING')
        : t('RESOURCES.RUNNING', { count: running.length, ram: ramGb.toFixed(1) }),
    onClose: toggleResources,
    onShutDown: (nodeId: string) => {
      stopRun(nodeId.replace('-device', ''));
    },
  };
};
