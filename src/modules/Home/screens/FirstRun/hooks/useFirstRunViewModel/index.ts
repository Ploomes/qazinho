import type { FirstRunStep, IFirstRunBuild } from '@/modules/Home/screens/FirstRun/types';
import type { ITarget } from '@/modules/Project';
import type { CSSProperties, KeyboardEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { newWorkspaceIn } from '@/modules/Assistant/library';
import { useChatAgent } from '@/modules/Chat';
import { FIRST_RUN, FIRST_RUN_EXAMPLES } from '@/modules/Home/constants';
import { planNameOf, projectNameOf } from '@/modules/Home/library';
import {
  newProjectId,
  projectAppOf,
  projectMarkOf,
  useSiteIcons,
  webAddressOf,
} from '@/modules/Project';
import { TARGET_NAME_KEYS } from '@/modules/Project/components/ProjectModal/constants';
import { useRunActions } from '@/modules/Run';
import { Files, Platform } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
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
  const { askAgent } = useChatAgent();
  const { runWorkspace } = useRunActions();
  const [step, setStep] = useState<FirstRunStep>('app');
  const [typed, setTyped] = useState('');
  const [build, setBuild] = useState<IFirstRunBuild | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [ask, setAsk] = useState('');

  const address = webAddressOf(typed);
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

  const goOn = () => {
    if (target !== null) {
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

  const create = (props: { name: string; now: number }): string | null => {
    if (target === null) return null;

    const project = {
      id: newProjectId(props.now),
      name: projectNameOf(target),
      targets: [target],
      repositories: [],
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
    const text = ask.trim();
    const workspaceId = text === '' ? null : create({ name: planNameOf(text), now });

    if (workspaceId === null) return;

    selectTab('chat');
    sendMessage({ workspaceId, text, mentions: [] });
    askAgent({
      workspaceId,
      text,
      references: [],
      code: null,
      jira: null,
      confluence: null,
    });
  };

  return {
    style: { '--first-run-column': `${String(FIRST_RUN.column)}px` } as CSSProperties,
    settingsLabel: t('COMMON.SETTINGS'),
    onSettings: openSettings,
    isAppStep: step === 'app',
    internSize: FIRST_RUN.intern,
    appTitle: t('FIRST_RUN.APP_TITLE'),
    appLead: t('FIRST_RUN.APP_LEAD'),
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
      name: target === null ? '' : projectNameOf(target),
      app: projectAppOf(target === null ? [] : [target]),
      icons,
    }),
    targetPlace:
      build !== null
        ? buildName
        : (projectAppOf(target === null ? [] : [target]).places[0] ?? ''),
    planTitle: t('FIRST_RUN.PLAN_TITLE'),
    planLead: t('FIRST_RUN.PLAN_LEAD'),
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
    canStart: ask.trim() !== '',
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
      setStep('app');
    },
    isAgentReady,
    agentLine: isAgentReady
      ? t('FIRST_RUN.AGENT_READY', { agent: agentName })
      : t('FIRST_RUN.AGENT_MISSING'),
  };
};
