import type { ISearchListItem } from '@/shared/components/molecules/SearchList/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SEARCH_PALETTE } from '@/app/components/SearchPalette/constants';
import { matchesQuery } from '@/modules/Chat/library';
import { useRunActions } from '@/modules/Run';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useSearchPaletteViewModel = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const projects = useAppStore((state) => state.projects);
  const closeSearch = useAppStore((state) => state.closeSearch);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const openSettings = useAppStore((state) => state.openSettings);
  const openWorkspaceModal = useAppStore((state) => state.openWorkspaceModal);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRunPlan } = useRunActions();
  const isAsking = query.trim() !== '';

  const placeOf = (projectId: string) =>
    projects.find(({ id }) => id === projectId)?.name ?? null;
  const nameOf = (name: string) => (name === '' ? t('WORKSPACE.UNNAMED') : name);

  const entries: { item: ISearchListItem; onPick: () => void }[] = [
    ...workspaces.map((workspace) => ({
      item: {
        id: `plan:${workspace.id}`,
        label: nameOf(workspace.name),
        tag: null,
        detail: placeOf(workspace.projectId),
      },
      onPick: () => {
        selectWorkspace(workspace.id);
      },
    })),
    ...(isAsking
      ? workspaces
          .filter(
            (workspace) =>
              workspace.plan.length > 0 &&
              (workspace.live === null || workspace.live.isDone),
          )
          .map((workspace) => ({
            item: {
              id: `run:${workspace.id}`,
              label: t('SEARCH.RUN', { plan: nameOf(workspace.name) }),
              tag: null,
              detail: placeOf(workspace.projectId),
            },
            onPick: () => {
              selectWorkspace(workspace.id);
              onRunPlan();
            },
          }))
      : []),
    ...(isAsking
      ? workspaces.flatMap((workspace) => {
          const count = workspace.bugs.filter(({ isDismissed }) => !isDismissed).length;

          return count === 0
            ? []
            : [
                {
                  item: {
                    id: `bugs:${workspace.id}`,
                    label:
                      count === 1
                        ? t('SEARCH.BUGS_ONE', { plan: nameOf(workspace.name) })
                        : t('SEARCH.BUGS_OTHER', { plan: nameOf(workspace.name), count }),
                    tag: null,
                    detail: placeOf(workspace.projectId),
                  },
                  onPick: () => {
                    selectWorkspace(workspace.id);
                    selectTab('bugs');
                  },
                },
              ];
        })
      : []),
    ...projects.map((project) => ({
      item: {
        id: `project:${project.id}`,
        label: project.name,
        tag: t('SEARCH.PROJECT'),
        detail: null,
      },
      onPick: () => {
        const first = workspaces.find(({ projectId }) => projectId === project.id);

        if (first === undefined) openWorkspaceModal(project.id);
        else selectWorkspace(first.id);
      },
    })),
    {
      item: { id: 'settings', label: t('SEARCH.SETTINGS'), tag: null, detail: null },
      onPick: openSettings,
    },
  ];

  const shown = entries.filter(({ item }) =>
    matchesQuery({ text: `${item.label} ${item.detail ?? ''}`, query }),
  );

  return {
    style: {
      '--search-palette-width': `${String(SEARCH_PALETTE.width)}px`,
      '--search-palette-top': `${String(SEARCH_PALETTE.top)}px`,
    } as CSSProperties,
    query,
    label: t('SEARCH.LABEL'),
    placeholder: t('SEARCH.PLACEHOLDER'),
    items: shown.map(({ item }) => item),
    emptyText: t('SEARCH.EMPTY', { query: query.trim() }),
    onQuery: setQuery,
    onPick: (id: string) => {
      const entry = entries.find(({ item }) => item.id === id);

      closeSearch();
      entry?.onPick();
    },
    onClose: closeSearch,
  };
};
