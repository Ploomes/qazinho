import type { ITitlebarProps } from '@/shared/components/organisms/Titlebar/types';
import { useTranslation } from 'react-i18next';
import { Platform } from '@/services';
import { useAppStore, useSettingsStore, useWorkspaceStore } from '@/store';

export const useTitlebarViewModel = (props: ITitlebarProps = {}) => {
  const { isBare = false } = props;
  const { t } = useTranslation();
  const isResourcesOpen = useAppStore((state) => state.isResourcesOpen);
  const screen = useAppStore((state) => state.screen);
  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null,
  );
  const isSidebarShut = useSettingsStore((state) => state.isSidebarShut);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);

  const project =
    workspace === null
      ? null
      : (projects.find(({ id }) => id === workspace.projectId) ?? null);

  return {
    isBare,
    className: [
      'titlebar',
      Platform.isMac() ? 'titlebar--mac' : 'titlebar--overlay',
      isBare ? 'titlebar--bare' : '',
    ]
      .filter((part) => part.length > 0)
      .join(' '),
    isResourcesOpen,
    hasSidebar: projects.length > 0 && screen !== 'settings',
    sidebarLabel: t(isSidebarShut ? 'SIDEBAR.OPEN' : 'SIDEBAR.SHUT'),
    onToggleSidebar: toggleSidebar,
    hasPlanActions: screen === 'workspace' && workspace !== null,
    crumbs:
      screen === 'settings'
        ? [{ key: 'settings', label: t('COMMON.SETTINGS') }]
        : screen === 'bugs'
          ? [{ key: 'bugs', label: t('BUG.TITLE') }]
          : screen === 'workspace' && workspace !== null
            ? [
                { key: 'project', label: project?.name ?? '' },
                {
                  key: 'plan',
                  label: workspace.name === '' ? t('WORKSPACE.UNNAMED') : workspace.name,
                },
              ].filter(({ label }) => label !== '')
            : projects.length > 0
              ? [{ key: 'home', label: t('HOME.TITLE') }]
              : [],
  };
};
