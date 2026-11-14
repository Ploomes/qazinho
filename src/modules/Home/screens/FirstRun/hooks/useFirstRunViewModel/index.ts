import type { FirstRunStep, IFirstRunBuild } from '@/modules/Home/screens/FirstRun/types';
import type { ITarget } from '@/modules/Project';
import type { IJiraIssueRef } from '@/shared/types';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newWorkspaceIn } from '@/modules/Assistant/library';
import { useChatAgent } from '@/modules/Chat';
import { FIRST_RUN, FIRST_RUN_EXAMPLES } from '@/modules/Home/constants';
import { planNameOf, projectNameOf, storyKeyOf } from '@/modules/Home/library';
import {
  newProjectId,
  projectAppOf,
  projectMarkOf,
  useSiteIcons,
  webAddressOf,
} from '@/modules/Project';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { useRunActions } from '@/modules/Run';
import { JIRA_FAILURE_KEYS } from '@/modules/Setup/constants';
import { blankWorkspaceOf } from '@/modules/Workspace/library';
import { Files, Jira, Platform } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useFirstRunViewModel = () => {
  const { t } = useTranslation();
  const putProject = useAppStore((state) => state.putProject);
  const selectWorkspace = useAppStore((state) => state.selectWorkspace);
  const openSettings = useAppStore((state) => state.openSettings);
  const addWorkspace = useWorkspaceStore((state) => state.addWorkspace);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const agentName = useSettingsStore((state) => state.agent);
  const agents = useMachineStore((state) => state.agents);
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const { askAgent } = useChatAgent();
  const { runWorkspace } = useRunActions();
  const [step, setStep] = useState<FirstRunStep>('app');
  const [typed, setTyped] = useState('');
  const [build, setBuild] = useState<IFirstRunBuild | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, setAsk] = useState('');
  const [story, setStory] = useState<IJiraIssueRef | null>(null);
  const [isFinding, setFinding] = useState(false);

  const storyKey = build === null && isJiraConnected ? storyKeyOf(typed) : null;
  const address = storyKey === null ? webAddressOf(typed) : null;
  const target: ITarget | null =
    build !== null
      ? {
          id: `t-${build.kind}`,
          kind: build.kind,
          label: t(TARGET_NAME_KEYS[build.kind]),
          value: build.path,
        }
      : address !== null
        ? { id: 't-web', kind: 'web', label: t(TARGET_NAME_KEYS.web), value: address }
        : null;
  const icons = useSiteIcons(
    step === 'plan' && build === null && address !== null ? [address] : [],
  );
  const agent = agents.find(({ name }) => name === agentName);
  const isAgentReady = agent?.isFound === true && agent.isSignedIn !== false;
  const buildName =
    build === null ? '' : (build.path.split(/[\\/]/).at(-1) ?? build.path);

  const findStory = async (key: string) => {
    setFinding(true);

    const found = await Jira.search(key);

    setFinding(false);

    if (!found.isListed) {
      setProblem(t(JIRA_FAILURE_KEYS[found.failure]));

      return;
    }

    const exact = found.issues.find((issue) => issue.key === key) ?? null;

    if (exact === null) {
      setProblem(t('FIRST_RUN.STORY_NOT_FOUND', { key }));

      return;
    }

    setStory(exact);
    setProblem(null);
    setStep('plan');
  };

  const goOn = () => {
    if (isFinding) return;

    if (storyKey !== null) {
      void findStory(storyKey);

      return;
    }

    if (target !== null) {
      setStory(null);
      setProblem(null);
      setStep('plan');

      return;
    }

    setProblem(typed.trim() === '' ? t('FIRST_RUN.NEEDS_APP') : t('PROJECT.WEB_INVALID'));
  };

  const pick = async (kind: IFirstRunBuild['kind']) => {
    const path = await Files.pick(kind === 'android' ? 'apk' : 'app');

    if (path === null) return;

    setBuild({ kind, path });
    setTyped('');
    setProblem(null);
  };

  const createFromStory = (props: {
    name: string;
    now: number;
    from: IJiraIssueRef;
  }): string => {
    const project = {
      id: newProjectId(props.now),
      name: props.from.key.split('-')[0] ?? props.from.key,
      targets: [],
      repositories: [],
    };
    const workspace = {
      ...blankWorkspaceOf({ projectId: project.id, name: props.name, now: props.now }),
      issue: {
        key: props.from.key,
        title: props.from.summary,
        source: 'jira' as const,
        url: props.from.url,
      },
    };

    putProject(project);
    addWorkspace(workspace);
    selectWorkspace(workspace.id);

    return workspace.id;
  };

  const create = (props: { name: string; now: number }): string | null => {
    if (target === null) return null;

    const project = {
      id: newProjectId(props.now),
      name: projectNameOf(target),
      targets: [target],
      repositories: [],
      isNamePending: true,
    };
    const made = newWorkspaceIn({
      project,
      name: props.name,
      kind: target.kind,
      now: props.now,
    });

    if (!made.isOk) return null;

    putProject(project);
    addWorkspace(made.workspace);
    selectWorkspace(made.workspace.id);

    return made.workspace.id;
  };

  const start = (now: number) => {
    const typedAsk = ask.trim();

    if (story !== null && target === null) {
      const workspaceId = createFromStory({
        name: typedAsk === '' ? story.key : planNameOf(typedAsk),
        now,
        from: story,
      });
      const text = [
        t('COMMANDS.JIRA_PLAN_SAY', { key: story.key, summary: story.summary }),
        typedAsk,
      ]
        .filter((part) => part !== '')
        .join('\n\n');

      selectTab('chat');
      sendMessage({
        workspaceId,
        text,
        mentions: [],
        command: { id: 'jira-plan', ...story },
      });
      askAgent({
        workspaceId,
        text,
        references: [],
        code: null,
        jira: { key: story.key },
        confluence: null,
      });

      return;
    }

    const workspaceId =
      typedAsk === '' ? null : create({ name: planNameOf(typedAsk), now });

    if (workspaceId === null) return;

    selectTab('chat');
    sendMessage({ workspaceId, text: typedAsk, mentions: [] });
    askAgent({
      workspaceId,
      text: typedAsk,
      references: [],
      code: null,
      jira: null,
      confluence: null,
    });
  };
  const isFromStory = story !== null && target === null;

  return {
    style: { '--first-run-column': `${String(FIRST_RUN.column)}px` } as CSSProperties,
    settingsLabel: t('COMMON.SETTINGS'),
    onSettings: openSettings,
    isAppStep: step === 'app',
    internSize: FIRST_RUN.intern,
    appTitle: t('FIRST_RUN.APP_TITLE'),
    appLead: isJiraConnected ? t('FIRST_RUN.APP_LEAD_STORY') : t('FIRST_RUN.APP_LEAD'),
    appPlaceholder: t('FIRST_RUN.APP_PLACEHOLDER'),
    appLabel: t('FIRST_RUN.APP_LABEL'),
    typed,
    onTypedChange: (value: string) => {
      setTyped(value);
      setProblem(null);
    },
    onFieldKey: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') goOn();
    },
    hasBuild: build !== null,
    buildKind: build?.kind ?? 'android',
    buildName,
    useAddressLabel: t('FIRST_RUN.USE_ADDRESS'),
    onClearBuild: () => {
      setBuild(null);
    },
    hasProblem: problem !== null,
    problem: problem ?? '',
    continueLabel: t('FIRST_RUN.CONTINUE'),
    onContinue: goOn,
    pickApkLabel: t('FIRST_RUN.PICK_APK'),
    onPickApk: () => {
      void pick('android');
    },
    canPickApp: Platform.isMac(),
    pickAppLabel: t('FIRST_RUN.PICK_APP'),
    onPickApp: () => {
      void pick('ios');
    },
    markSize: FIRST_RUN.mark,
    targetMark: projectMarkOf({
      name: target !== null ? projectNameOf(target) : (story?.key.split('-')[0] ?? ''),
      app: projectAppOf(target === null ? [] : [target]),
      icons,
    }),
    targetPlace: isFromStory
      ? `${story.key} · ${story.summary}`
      : build !== null
        ? buildName
        : (projectAppOf(target === null ? [] : [target]).places[0] ?? ''),
    planTitle: t('FIRST_RUN.PLAN_TITLE'),
    planLead: isFromStory ? t('FIRST_RUN.PLAN_LEAD_STORY') : t('FIRST_RUN.PLAN_LEAD'),
    planPlaceholder: t('FIRST_RUN.PLAN_PLACEHOLDER'),
    ask,
    onAskChange: setAsk,
    onAskKey: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) start(Date.now());
    },
    examplesTitle: t('FIRST_RUN.EXAMPLES'),
    examples: FIRST_RUN_EXAMPLES.map((key) => ({
      key,
      label: t(key),
      onPick: () => {
        setAsk(t(key));
      },
    })),
    canStart: isFromStory || ask.trim() !== '',
    isContinuing: isFinding,
    canExplore: !isFromStory,
    startLabel: t('FIRST_RUN.START'),
    onStart: () => {
      start(Date.now());
    },
    exploreLabel: t('FIRST_RUN.EXPLORE'),
    onExplore: () => {
      const workspaceId = create({ name: t('FIRST_RUN.EXPLORE_PLAN'), now: Date.now() });

      if (workspaceId !== null) void runWorkspace(workspaceId, 'explore');
    },
    backLabel: t('FIRST_RUN.BACK'),
    onBack: () => {
      setStory(null);
      setStep('app');
    },
    isAgentReady,
    agentLine: isAgentReady
      ? t('FIRST_RUN.AGENT_READY', { agent: agentName })
      : t('FIRST_RUN.AGENT_MISSING'),
  };
};
