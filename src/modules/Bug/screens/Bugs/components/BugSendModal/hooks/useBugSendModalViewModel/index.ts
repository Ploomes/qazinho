import type { IBugSendModalProps } from '@/modules/Bug/screens/Bugs/components/BugSendModal/types';
import type { IconName } from '@/shared/components/atoms/Icon/types';
import type {
  IRepositoryList,
  IssueTarget,
  IssueTracker,
  JiraProjectList,
} from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { filingPlanOf, issueTargetOf } from '@/modules/Bug/library';
import { BUG_SEND } from '@/modules/Bug/screens/Bugs/components/BugSendModal/constants';
import {
  GITHUB_FAILURE_KEYS,
  INTEGRATIONS,
  JIRA_FAILURE_KEYS,
} from '@/modules/Setup/constants';
import { Github, Jira } from '@/services';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useBugSendModalViewModel = (props: IBugSendModalProps) => {
  const { bug, onCancel, onSend } = props;
  const { t } = useTranslation();
  const integrations = useSetupStore((state) => state.integrations);
  const workspace = useWorkspaceStore(
    (state) => state.workspaces.find(({ id }) => id === props.workspaceId) ?? null,
  );
  const project = useAppStore(
    (state) => state.projects.find(({ id }) => id === workspace?.projectId) ?? null,
  );
  const openSettings = useAppStore((state) => state.openSettings);
  const say = useAssistantStore((state) => state.say);
  const selectTab = useSettingsStore((state) => state.selectTab);
  const [chosen, setChosen] = useState<IssueTracker | null>(null);
  const [picked, setPicked] = useState<IssueTarget | null>(null);
  const [isPicking, setIsPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState(bug.title);
  const [projects, setProjects] = useState<JiraProjectList | null>(null);
  const [repositories, setRepositories] = useState<IRepositoryList | null>(null);

  const trackers = INTEGRATIONS.flatMap(({ id, name, logo }) =>
    (id === 'jira' || id === 'github') && integrations.some((status) => status.id === id)
      ? [{ id, name, logo }]
      : [],
  );
  const story = workspace?.issue?.source === 'jira' ? workspace.issue.key : null;
  const linked = project?.repositories ?? [];
  const suggest = (only: IssueTracker[]) =>
    issueTargetOf({
      kept: project?.issueTarget ?? null,
      trackers: only,
      story,
      projects: [],
      repositories: linked,
    });
  const tracker =
    chosen ?? suggest(trackers.map(({ id }) => id))?.tracker ?? trackers[0]?.id ?? null;
  const suggested = tracker === null ? null : suggest([tracker]);
  const target =
    picked !== null && picked.tracker === tracker ? picked : isPicking ? null : suggested;
  const plan =
    workspace === null || tracker === null
      ? null
      : filingPlanOf({ workspace, bug, tracker });
  const shown = trackers.find(({ id }) => id === tracker) ?? null;
  const listed = projects?.isListed === true ? projects.projects : [];
  const all = repositories?.isListed === true ? repositories.repositories : [];
  const isAndroid =
    project?.targets.find(({ id }) => id === workspace?.targetId)?.kind === 'android';
  const needsProjects = tracker === 'jira' && projects === null;
  const needsRepositories =
    tracker === 'github' && target === null && repositories === null;

  useEffect(() => {
    if (!needsProjects) return;

    let isLive = true;

    void Jira.projects().then((list) => {
      if (isLive) setProjects(list);
    });

    return () => {
      isLive = false;
    };
  }, [needsProjects]);

  useEffect(() => {
    if (!needsRepositories) return;

    let isLive = true;

    void Github.repositories().then((list) => {
      if (isLive) setRepositories(list);
    });

    return () => {
      isLive = false;
    };
  }, [needsRepositories]);

  const goes: { key: string; icon: IconName; text: string }[] =
    plan === null
      ? []
      : [
          { key: 'text', icon: 'plan', text: t('FILING.GOES_TEXT') },
          ...(plan.shots.length === 0
            ? []
            : [
                {
                  key: 'shots',
                  icon: 'image' as const,
                  text:
                    plan.shots.length === 1
                      ? t('FILING.GOES_SHOTS_ONE')
                      : t('FILING.GOES_SHOTS_OTHER', { count: plan.shots.length }),
                },
              ]),
          ...(plan.videoRun === null
            ? []
            : [
                {
                  key: 'video',
                  icon: 'clip' as const,
                  text: isAndroid ? t('FILING.GOES_RECORDING') : t('FILING.GOES_CLIP'),
                },
              ]),
          ...(tracker !== 'jira' || plan.story === null
            ? []
            : [
                {
                  key: 'story',
                  icon: 'link' as const,
                  text: t('FILING.GOES_STORY', { key: plan.story.key }),
                },
              ]),
        ];
  const canSend = target !== null && plan !== null && title.trim() !== '';

  return {
    title: t('FILING.TITLE', { id: bug.id }),
    subtitle: t('FILING.SUBTITLE'),
    width: BUG_SEND.width,
    style: { '--bug-send-logo': `${String(BUG_SEND.logoPx)}px` } as CSSProperties,
    isConnected: trackers.length > 0,
    noTracker: t('FILING.NO_TRACKER'),
    confirmLabel:
      trackers.length === 0
        ? t('FILING.OPEN_INTEGRATIONS')
        : tracker === 'github'
          ? t('FILING.SEND_GITHUB')
          : t('FILING.SEND_JIRA'),
    canConfirm: trackers.length === 0 || canSend,
    onConfirm: () => {
      if (trackers.length === 0) {
        say(t('FILING.TIP_CONNECT'));
        selectTab('integrations');
        openSettings();
        onCancel();

        return;
      }

      if (target !== null && plan !== null && canSend)
        onSend({ target, title: title.trim(), plan });
    },
    onCancel,
    whereLabel: t('FILING.WHERE'),
    hasTrackerChoice: trackers.length > 1,
    trackers: trackers.map((one) => ({
      ...one,
      isOn: one.id === tracker,
      className:
        one.id === tracker
          ? 'bug-send__tracker bug-send__tracker--on'
          : 'bug-send__tracker',
      onClick: () => {
        if (one.id === tracker) return;

        setChosen(one.id);
        setPicked(null);
        setIsPicking(false);
        setQuery('');
      },
    })),
    picked:
      target === null || shown === null
        ? null
        : target.tracker === 'jira'
          ? {
              id: `jira-${target.project}`,
              logo: shown.logo,
              label:
                listed.find(({ key }) => key === target.project)?.name ?? target.project,
              detail: target.project,
            }
          : {
              id: `github-${target.owner}/${target.name}`,
              logo: shown.logo,
              label: `${target.owner}/${target.name}`,
              detail: null,
            },
    pickAnotherLabel: t('FILING.PICK_ANOTHER'),
    onClearPicked: () => {
      setPicked(null);
      setIsPicking(true);
    },
    search:
      tracker === 'jira'
        ? {
            query,
            label: t('FILING.PICK_PROJECT'),
            placeholder: t('FILING.PICK_PROJECT'),
            items: listed.map(({ key, name }) => ({
              id: key,
              label: name,
              tag: key,
              detail: null,
            })),
            note:
              projects === null
                ? t('FILING.PROJECTS_LOADING')
                : !projects.isListed
                  ? t(JIRA_FAILURE_KEYS[projects.failure])
                  : listed.length === 0
                    ? t('FILING.NO_PROJECTS')
                    : null,
            emptyText: t('FILING.NONE_FOUND', { query: query.trim() }),
            isAutoFocused: isPicking,
          }
        : {
            query,
            label: t('FILING.PICK_REPOSITORY'),
            placeholder: t('FILING.PICK_REPOSITORY'),
            items: [
              ...linked.map(({ owner, name }) => ({ owner, name, description: null })),
              ...all.filter(({ owner, name }) =>
                linked.every((one) => one.owner !== owner || one.name !== name),
              ),
            ].map(({ owner, name, description }) => ({
              id: `${owner}/${name}`,
              label: `${owner}/${name}`,
              tag: null,
              detail: description,
            })),
            note:
              repositories === null && linked.length === 0
                ? t('FILING.REPOSITORIES_LOADING')
                : repositories?.isListed === false && linked.length === 0
                  ? t(GITHUB_FAILURE_KEYS[repositories.failure])
                  : repositories?.isListed === true &&
                      linked.length === 0 &&
                      all.length === 0
                    ? t('FILING.NO_REPOSITORIES')
                    : null,
            emptyText: t('FILING.NONE_FOUND', { query: query.trim() }),
            isAutoFocused: isPicking,
          },
    onQuery: setQuery,
    onPick: (id: string) => {
      const [owner = '', name = ''] = id.split('/');

      setPicked(
        tracker === 'jira'
          ? { tracker: 'jira', project: id }
          : { tracker: 'github', owner, name },
      );
      setIsPicking(false);
      setQuery('');
    },
    titleLabel: t('FILING.TITLE_LABEL'),
    titleValue: title,
    onTitle: setTitle,
    goesLabel: t('FILING.GOES'),
    goes,
    githubNote: tracker === 'github' ? t('FILING.GOES_GITHUB') : null,
  };
};
