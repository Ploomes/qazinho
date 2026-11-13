import type { IHomeFailed } from '@/modules/Home/types';
import type { WorkspaceTab } from '@/modules/Workspace/types';
import type { CSSProperties } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatClock } from '@/modules/Chat';
import { HOME_ITEMS, HOME_SCREEN } from '@/modules/Home/constants';
import { dayKeyOf, homeOf } from '@/modules/Home/library';
import { useStoryCheck, waitingDoubtsOf } from '@/modules/Plan';
import { projectAppOf, projectMarkOf, useSiteIcons } from '@/modules/Project';
import { dayLabelOf, flattenPlanSteps, RUN_HOW_KEYS, useRunActions } from '@/modules/Run';
import { Run } from '@/services';
import { HOME } from '@/shared/constants';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useHomeViewModel = () => {
  const { t, i18n } = useTranslation();
  const projects = useAppStore((state) => state.projects);
  const recent = useAppStore((state) => state.recent);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const developed = useWorkspaceStore((state) => state.developedCases);
  const setDeveloped = useWorkspaceStore((state) => state.setDevelopedCases);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const { onRunPlan, onWalkByHand } = useRunActions();
  const { check } = useStoryCheck();
  const icons = useSiteIcons(
    projects.flatMap(({ targets }) => projectAppOf(targets).address ?? []),
  );

  const home = homeOf({
    projects,
    workspaces,
    developed,
    recent,
    shown: HOME.recentShown,
    unnamed: t('WORKSPACE.UNNAMED'),
  });

  const unknownKey = workspaces
    .filter(
      (workspace) =>
        developed[workspace.id] === undefined &&
        workspace.plan.length > 0 &&
        (workspace.live === null || workspace.live.isDone),
    )
    .map(({ id }) => id)
    .join('\n');

  useEffect(() => {
    const ids = unknownKey.split('\n');
    const known = useAppStore.getState().projects;

    for (const workspace of useWorkspaceStore.getState().workspaces) {
      const targetKind = known
        .find(({ id }) => id === workspace.projectId)
        ?.targets.find(({ id }) => id === workspace.targetId)?.kind;

      if (!ids.includes(workspace.id) || targetKind === undefined) continue;

      void Run.developed({
        workspaceId: workspace.id,
        steps: flattenPlanSteps(workspace.plan),
        targetKind,
      }).then(({ caseIds, files }) => {
        setDeveloped({ workspaceId: workspace.id, caseIds, files });
      });
    }
  }, [unknownKey, setDeveloped]);

  const storyKey = workspaces
    .filter(
      (workspace) =>
        workspace.issue?.source === 'jira' &&
        (workspace.storyStage === 'ahead' ||
          waitingDoubtsOf(workspace.doubts ?? []).length > 0),
    )
    .map(({ id }) => id)
    .join('\n');

  useEffect(() => {
    for (const workspaceId of storyKey.split('\n'))
      if (workspaceId !== '') void check({ workspaceId });
  }, [storyKey, check]);

  const listOf = (ids: string[]) =>
    new Intl.ListFormat(i18n.language, { style: 'long', type: 'conjunction' }).format(
      ids,
    );

  const whenOf = (at: number) => {
    const day = dayKeyOf(at);
    const now = new Date();
    const label = dayLabelOf({
      day,
      now,
      language: i18n.language,
      words: { today: t('COMMON.TODAY'), yesterday: t('COMMON.YESTERDAY') },
    });

    return day === dayKeyOf(now.getTime())
      ? t('HOME.WHEN', { day: label, time: formatClock(new Date(at)) })
      : label;
  };

  const failedTextOf = (item: IHomeFailed) => {
    const failed =
      item.failed === 0
        ? t('HOME.FAILED_RUN', { plan: item.plan })
        : t(item.failed === 1 ? 'HOME.FAILED_ONE' : 'HOME.FAILED_OTHER', {
            plan: item.plan,
            count: item.failed,
          });

    return item.bugs === 0
      ? failed
      : t('HOME.FAILED_WITH_BUGS', {
          failed,
          bugs:
            item.bugs === 1
              ? t('HOME.BUGS_ONE')
              : t('HOME.BUGS_OTHER', { count: item.bugs }),
        });
  };

  const open = (props: { workspaceId: string; tab: WorkspaceTab | null }) => {
    selectWorkspace(props.workspaceId);

    if (props.tab !== null) selectTab(props.tab);
  };

  const groups = [
    {
      id: 'asking',
      title: t('HOME.GROUP_ASKING'),
      items: home.asking.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.asking,
        text: t('HOME.ASKING', { plan: item.plan, question: item.question }),
        project: item.project,
        action: t('HOME.ANSWER'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'chat' });
        },
      })),
    },
    {
      id: 'failed',
      title: t('HOME.GROUP_FAILED'),
      items: home.failed.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.failed,
        text: failedTextOf(item),
        project: item.project,
        action:
          item.bugs === 0
            ? t('HOME.SEE_RUN')
            : item.bugs === 1
              ? t('HOME.SEE_BUG')
              : t('HOME.SEE_BUGS'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: item.bugs === 0 ? 'runs' : 'bugs' });
        },
      })),
    },
    {
      id: 'going',
      title: t('HOME.GROUP_GOING'),
      items: home.going.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS[item.kind],
        text:
          item.kind === 'paused'
            ? t('HOME.PAUSED', { plan: item.plan })
            : item.isExplore
              ? t(item.total === 1 ? 'HOME.EXPLORING_ONE' : 'HOME.EXPLORING_OTHER', {
                  plan: item.plan,
                  count: item.total,
                })
              : t('HOME.RUNNING', {
                  plan: item.plan,
                  how: t(RUN_HOW_KEYS[item.how ?? 'replay']),
                  current: item.current,
                  total: item.total,
                }),
        project: item.project,
        action: t('HOME.WATCH'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'device' });
        },
      })),
    },
    {
      id: 'continue',
      title: t('HOME.GROUP_CONTINUE'),
      items: home.toContinue.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.toContinue,
        text: t(item.cases === 1 ? 'HOME.CONTINUE_ONE' : 'HOME.CONTINUE_OTHER', {
          plan: item.plan,
          count: item.cases,
        }),
        project: item.project,
        action: t('HOME.OPEN'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'plan' });
        },
      })),
    },
    {
      id: 'arrived',
      title: t('HOME.GROUP_ARRIVED'),
      items: home.arrived.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.arrived,
        text: t('HOME.ARRIVED', { key: item.key, plan: item.plan }),
        project: item.project,
        action: t('HOME.DEVELOP'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'plan' });
          onRunPlan();
        },
      })),
    },
    {
      id: 'answered',
      title: t('HOME.GROUP_ANSWERED'),
      items: home.answered.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.answered,
        text: t('HOME.ANSWERED', { ids: listOf(item.ids), plan: item.plan }),
        project: item.project,
        action: t('HOME.SEE_ANSWERS'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'plan' });
        },
      })),
    },
    {
      id: 'changed',
      title: t('HOME.GROUP_CHANGED'),
      items: home.changed.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.changed,
        text:
          item.toReview > 0
            ? t(item.toReview === 1 ? 'HOME.TO_REVIEW_ONE' : 'HOME.TO_REVIEW_OTHER', {
                plan: item.plan,
                count: item.toReview,
              })
            : t('HOME.CHANGED', { sources: listOf(item.sources), plan: item.plan }),
        project: item.project,
        action: t('HOME.REVIEW'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'plan' });
        },
      })),
    },
    {
      id: 'byHand',
      title: t('HOME.GROUP_BY_HAND'),
      items: home.byHand.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.byHand,
        text:
          item.cases === 1
            ? t('HOME.BY_HAND_ONE', { id: item.caseId, plan: item.plan })
            : t('HOME.BY_HAND_OTHER', { count: item.cases, plan: item.plan }),
        project: item.project,
        action: t('HOME.WALK_BY_HAND'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'device' });
          onWalkByHand(item.caseId);
        },
      })),
    },
    {
      id: 'develop',
      title: t('HOME.GROUP_DEVELOP'),
      items: home.toDevelop.map((item) => ({
        id: item.workspaceId,
        ...HOME_ITEMS.toDevelop,
        text: t(item.cases === 1 ? 'HOME.DEVELOP_ONE' : 'HOME.DEVELOP_OTHER', {
          plan: item.plan,
          count: item.cases,
        }),
        project: '',
        action: t('HOME.DEVELOP'),
        onAction: () => {
          open({ workspaceId: item.workspaceId, tab: 'plan' });
          onRunPlan();
        },
      })),
    },
  ]
    .filter(({ items }) => items.length > 0)
    .map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        project:
          item.project === '' ? '' : t('HOME.IN_PROJECT', { project: item.project }),
      })),
    }));

  return {
    style: {
      '--home-column': `${String(HOME_SCREEN.column)}px`,
      '--home-row': `${String(HOME_SCREEN.row)}px`,
      '--home-recent': `${String(HOME_SCREEN.recent)}px`,
    } as CSSProperties,
    title: t('HOME.TITLE'),
    lead: t('HOME.LEAD'),
    isQuiet: groups.length === 0,
    quiet: t('HOME.QUIET'),
    groups,
    hasRecent: home.recent.length > 0,
    recentTitle: t('HOME.GROUP_RECENT'),
    markSize: HOME_SCREEN.mark,
    recent: home.recent.map((item) => {
      const project = projects.find(({ id }) => id === item.projectId);

      return {
        id: item.workspaceId,
        plan: item.plan,
        mark: projectMarkOf({
          name: item.project,
          app: projectAppOf(project?.targets ?? []),
          icons,
        }),
        when: whenOf(item.at),
        onOpen: () => {
          open({ workspaceId: item.workspaceId, tab: null });
        },
      };
    }),
  };
};
