import { useTranslation } from 'react-i18next';
import { Platform } from '@/services';
import { useAppStore, useMachineStore, useSettingsStore } from '@/store';

export const useTitlebarViewModel = () => {
  const { t } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const selectedProjectId = useAppStore((state) => state.selectedProjectId);
  const isResourcesOpen = useAppStore((state) => state.isResourcesOpen);
  const isModelMenuOpen = useAppStore((state) => state.isModelMenuOpen);
  const toggleResources = useAppStore((state) => state.toggleResources);
  const toggleModelMenu = useAppStore((state) => state.toggleModelMenu);
  const resources = useMachineStore((state) => state.resources);
  const agent = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);

  const project = projects.find(({ id }) => id === selectedProjectId) ?? projects[0];
  const cpu = Math.round(resources.cpu);
  const ramGb = resources.ramMb / 1024;
  const processCount = resources.processes.length;

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
      ceiling: resources.ramCeilingGb,
    }),
    processLabel:
      processCount === 1
        ? t('TITLEBAR.PROCESSES_ONE')
        : t('TITLEBAR.PROCESSES_OTHER', { count: processCount }),
    agentLabel: t('TITLEBAR.CONTEXT_LEFT', { agent, model, percent: 96 }),
    onToggleResources: toggleResources,
    onToggleModelMenu: toggleModelMenu,
  };
};
