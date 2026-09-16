import { RESOURCES } from '@/modules/Resources/constants';
import { buildProcessTree } from '@/modules/Resources/library';
import { Platform } from '@/services';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useTitlebarViewModel = () => {
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
    cpuLabel: `CPU ${String(cpu)}%`,
    cpuShare: cpu / 100,
    ramLabel: `RAM ${ramGb.toFixed(1)} / ${String(RESOURCES.ramCeilingGb)} GB`,
    processLabel:
      leaves.length === 1 ? '1 process' : `${String(leaves.length)} processes`,
    agentLabel: `${agent} · ${model} · 96 % context left`,
    onToggleResources: toggleResources,
    onToggleModelMenu: toggleModelMenu,
  };
};
