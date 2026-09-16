import { useTranslation } from 'react-i18next';
import { RESOURCES } from '@/modules/Resources/constants';
import { buildProcessTree } from '@/modules/Resources/library';
import { Platform } from '@/services';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useTitlebarViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const isResourcesOpen = useAppStore((state) => state.isResourcesOpen);
  const isModelMenuOpen = useAppStore((state) => state.isModelMenuOpen);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);

  const project = projects.find(({ id }) => id === selectedProjectId) ?? projects[0];
  const nodes = buildProcessTree({ projects, workspaces });
  const leaves = nodes.filter(({ level }) => level === 2);
  const cpu = leaves.reduce((total, node) => total + node.cpu, 0);
  const ramGb = leaves.reduce((total, node) => total + node.ramGb, 0);

  return {
    projectName: project?.name ?? null,
    hasProjects: projects.length > 0,
    isMac: Platform.isMac(),
    isResourcesOpen,
    isModelMenuOpen,
    cpuLabel: t('TITLEBAR.CPU', { percent: cpu }),
    cpuShare: cpu / 100,
    ramLabel: t('TITLEBAR.RAM', {
      used: ramGb.toFixed(1),
      ceiling: RESOURCES.ramCeilingGb,
    }),
    processLabel:
      leaves.length === 1
        ? t('TITLEBAR.PROCESSES_ONE')
        : t('TITLEBAR.PROCESSES_OTHER', { count: leaves.length }),
    agentLabel: t('TITLEBAR.CONTEXT_LEFT', { agent, model, percent: 96 }),
    onToggleResources: toggleResources,
    onToggleModelMenu: toggleModelMenu,
  };
};
