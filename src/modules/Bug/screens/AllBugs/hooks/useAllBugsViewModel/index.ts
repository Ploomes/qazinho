import type { BugFilter } from '@/modules/Bug/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BUG_FILTER_KEYS, BUG_FILTERS } from '@/modules/Bug/constants';
import { ALL_BUGS } from '@/modules/Bug/screens/AllBugs/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useAllBugsViewModel = () => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<BugFilter>('open');
  const projects = useAppStore((state) => state.projects);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);

  const isMany = projects.length > 1;
  const entries = workspaces.flatMap((workspace) =>
    workspace.bugs.map((bug) => ({ workspace, bug })),
  );
  const inTab = (tab: BugFilter) =>
    entries.filter(({ bug }) =>
      tab === 'dismissed'
        ? bug.isDismissed
        : tab === 'filed'
          ? !bug.isDismissed && bug.filed !== null
          : !bug.isDismissed && bug.filed === null,
    );
  const open = inTab('open');
  const filed = inTab('filed');
  const tabs = BUG_FILTERS.filter((id) => id === 'open' || inTab(id).length > 0);
  const shownTab = tabs.includes(filter) ? filter : 'open';

  return {
    style: {
      '--all-bugs-column': `${String(ALL_BUGS.column)}px`,
      '--bug-thumb-width': `${String(ALL_BUGS.thumbWidthPx)}px`,
    } as CSSProperties,
    title: t('BUG.TITLE'),
    summary: [
      open.length === 0
        ? t('BUG.LIST_OPEN_NONE')
        : open.length === 1
          ? t('BUG.LIST_OPEN_ONE')
          : t('BUG.LIST_OPEN_OTHER', { count: open.length }),
      ...(filed.length === 0
        ? []
        : [
            filed.length === 1
              ? t('BUG.LIST_FILED_ONE')
              : t('BUG.LIST_FILED_OTHER', { count: filed.length }),
          ]),
    ].join(' '),
    isEmpty: entries.length === 0,
    emptyTitle: t('BUG.EMPTY_TITLE'),
    emptyBody: t('BUG.EMPTY_BODY'),
    emptyTab: t('BUG.SUMMARY_NONE'),
    tabs: tabs.map((id) => ({
      id,
      label: t(BUG_FILTER_KEYS[id]),
      count: id === 'open' && open.length > 0 ? String(open.length) : null,
      isActive: id === shownTab,
      className:
        id === shownTab ? 'all-bugs__tab all-bugs__tab--active' : 'all-bugs__tab',
      onClick: () => {
        setFilter(id);
      },
    })),
    rows: inTab(shownTab).map(({ workspace, bug }) => {
      const hero = bug.shots.find(({ isBad }) => isBad) ?? bug.shots[0] ?? null;

      return {
        id: `${workspace.id}/${bug.id}`,
        title: bug.title,
        thumb: { src: hero?.src ?? null, file: hero?.file ?? null },
        where: t(isMany ? 'BUG.ALL_ROW_WHERE' : 'BUG.PROJECT_ROW_WHERE', {
          plan: workspace.name === '' ? t('WORKSPACE.UNNAMED') : workspace.name,
          project: projects.find(({ id }) => id === workspace.projectId)?.name ?? '',
          step: bug.stepNumber,
          caseId: bug.caseId,
        }),
        seen:
          bug.seenRuns > 1
            ? t('BUG.ROW_SEEN_OTHER', { count: bug.seenRuns })
            : t('BUG.ROW_SEEN_ONE'),
        when: bug.runWhen,
        onOpen: () => {
          selectWorkspace(workspace.id);
          selectTab('bugs');

          if (useWorkspaceStore.getState().openBugId !== bug.id) toggleBug(bug.id);
        },
      };
    }),
  };
};
