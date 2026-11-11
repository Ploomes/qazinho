import type { ITitlebarProps } from '@/shared/components/organisms/Titlebar/types';
import { useTranslation } from 'react-i18next';
import { Platform } from '@/services';
import { useAppStore, useWorkspaceStore } from '@/store';

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
  const renameWorkspace = useWorkspaceStore((state) => state.renameWorkspace);

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
    crumbsLabel: t('COMMON.WHERE'),
    hasPlanActions: screen === 'workspace' && workspace !== null,
    onRename: (name: string) => {
      if (workspace !== null) renameWorkspace({ workspaceId: workspace.id, name });
    },
    crumbs:
      screen === 'settings'
        ? [{ key: 'settings', label: t('COMMON.SETTINGS'), isPlan: false }]
        : screen === 'bugs'
          ? [{ key: 'bugs', label: t('BUG.TITLE'), isPlan: false }]
          : screen === 'workspace' && workspace !== null
            ? [
                { key: 'project', label: project?.name ?? '', isPlan: false },
                {
                  key: 'plan',
                  label: workspace.name === '' ? t('WORKSPACE.UNNAMED') : workspace.name,
                  isPlan: true,
                },
              ].filter(({ label }) => label !== '')
            : projects.length > 0
              ? [{ key: 'home', label: t('HOME.TITLE'), isPlan: false }]
              : [],
  };
};
