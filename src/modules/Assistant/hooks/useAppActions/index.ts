import type { ConfirmDecision, IAppPort, IToolDone } from '@/modules/Assistant/types';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  confluenceWantedOf,
  isConfirmCall,
  performAppTool,
  pickPage,
  subjectOf,
} from '@/modules/Assistant/library';
import { useSendBug } from '@/modules/Bug';
import { useBuildActions } from '@/modules/Build';
import { useChatAgent } from '@/modules/Chat';
import { useVariableActions } from '@/modules/Project';
import { useRunActions } from '@/modules/Run';
import { PLATFORM_LABEL } from '@/modules/Workspace';
import {
  Agent,
  Archive,
  Assistant,
  Confluence,
  Github,
  Integrations,
  Jira,
  Run,
} from '@/services';
import { ASSISTANT_WAIT } from '@/shared/constants';
import {
  useAppStore,
  useAppToolStore,
  useAssistantStore,
  useBuildStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useAppActions = () => {
  const { t } = useTranslation();
  const { runWorkspace, stopWorkspace } = useRunActions();
  const { startBuild } = useBuildActions();
  const { askAgent } = useChatAgent();
  const { askVariables, applyVariables } = useVariableActions();
  const { send } = useSendBug();
  const waiting = useRef(new Map<string, (decision: ConfirmDecision) => void>());

  useEffect(
    () =>
      useAssistantStore.subscribe((state) => {
        for (const message of state.messages) {
          if (message.kind !== 'confirm' || message.decision === null) continue;

          const settle = waiting.current.get(message.id);

          if (settle === undefined) continue;

          waiting.current.delete(message.id);
          settle(message.decision);
        }
      }),
    [],
  );

  useEffect(() => {
    const bringForward = () => {
      const app = useAppStore.getState();

      app.closeModal();
      app.closeMedia();
      app.closeReplay();
    };

    const port: IAppPort = {
      read: () => ({
        projects: useAppStore.getState().projects,
        workspaces: useWorkspaceStore.getState().workspaces,
        askingIds: useWorkspaceStore.getState().askingIds,
        integrations: useSetupStore.getState().integrations,
        builds: useBuildStore.getState().builds,
        hasAndroidSdk: useMachineStore.getState().tools.androidSdk.isFound,
        hasXcode: useMachineStore.getState().tools.xcode.isFound,
        variables: useVariablesStore.getState().byProject,
      }),
      now: () => Date.now(),
      targetLabel: (kind) => t(PLATFORM_LABEL[kind]),
      themeName: (theme) =>
        t(theme === 'dark' ? 'SETTINGS.THEME_DARK' : 'SETTINGS.THEME_LIGHT'),
      openWorkspace: ({ workspaceId, tab, runId, bugId }) => {
        const workspaces = useWorkspaceStore.getState();

        bringForward();
        useAppStore.getState().selectWorkspace(workspaceId);
        workspaces.selectTab(tab);

        if (runId !== null) workspaces.selectRun(runId);

        if (bugId !== null && workspaces.openBugId !== bugId) workspaces.toggleBug(bugId);
      },
      openProject: (projectId) => {
        bringForward();
        useAppStore.getState().openProjectSettings(projectId);
      },
      openSettings: (section) => {
        if (section !== null) useSettingsStore.getState().selectTab(section);

        bringForward();
        useAppStore.getState().openSettings();
      },
      goHome: () => {
        bringForward();
        useAppStore.getState().goHome();
      },
      putProject: (project) => {
        useAppStore.getState().putProject(project);
      },
      removeProject: (projectId) => {
        const { selectedWorkspaceId, removeProject } = useAppStore.getState();
        const own = useWorkspaceStore
          .getState()
          .workspaces.filter((workspace) => workspace.projectId === projectId);

        for (const workspace of own) {
          Run.stop(workspace.id);
          void Agent.stop(workspace.id);
          Archive.removeWorkspace(workspace.id);
        }

        useWorkspaceStore.getState().removeWorkspacesOf(projectId);
        removeProject({
          projectId,
          isOpen: own.some((workspace) => workspace.id === selectedWorkspaceId),
        });
      },
      addWorkspace: (workspace) => {
        bringForward();
        useWorkspaceStore.getState().addWorkspace(workspace);
        useAppStore.getState().selectWorkspace(workspace.id);
      },
      renameWorkspace: (rename) => {
        useWorkspaceStore.getState().renameWorkspace(rename);
      },
      dismissBug: (dismissal) => {
        useWorkspaceStore.getState().dismissBug(dismissal);
      },
      setDesign: (link) => {
        useWorkspaceStore.getState().setDesign(link);
      },
      removeWorkspace: (workspaceId) => {
        Run.stop(workspaceId);
        void Agent.stop(workspaceId);
        useWorkspaceStore.getState().removeWorkspace(workspaceId);
        useAppStore.getState().forgetPlanMemories(workspaceId);
        Archive.removeWorkspace(workspaceId);

        if (useAppStore.getState().selectedWorkspaceId === workspaceId)
          useAppStore.getState().goHome();
      },
      runWorkspace: (workspaceId) => {
        bringForward();
        useAppStore.getState().selectWorkspace(workspaceId);

        return runWorkspace(workspaceId);
      },
      exploreWorkspace: (workspaceId) => {
        bringForward();
        useAppStore.getState().selectWorkspace(workspaceId);

        return runWorkspace(workspaceId, 'explore');
      },
      stopWorkspace,
      askWorkspaceChat: ({ workspaceId, text, story, page, design }) => {
        bringForward();
        useAppStore.getState().selectWorkspace(workspaceId);
        useWorkspaceStore.getState().selectTab('chat');

        if (design !== null)
          useWorkspaceStore.getState().setDesign({ workspaceId, design });

        useWorkspaceStore.getState().sendMessage({
          workspaceId,
          text,
          mentions: [],
          ...(story !== null
            ? { command: { id: 'jira-plan' as const, ...story } }
            : page !== null
              ? {
                  command: {
                    id: 'confluence-plan' as const,
                    pageId: page.id,
                    title: page.title,
                    space: page.space,
                    url: page.url,
                  },
                }
              : design !== null
                ? {
                    command: {
                      id: 'figma-plan' as const,
                      name: design.name,
                      nodeId: design.nodeId,
                      url: design.url,
                    },
                  }
                : {}),
        });
        askAgent({
          workspaceId,
          text: [
            ...(story === null
              ? []
              : [
                  t('COMMANDS.JIRA_PLAN_SAY', { key: story.key, summary: story.summary }),
                ]),
            ...(page === null
              ? []
              : [t('COMMANDS.CONFLUENCE_PLAN_SAY', { title: page.title })]),
            ...(design === null
              ? []
              : [t('COMMANDS.FIGMA_PLAN_SAY', { name: design.name })]),
            text,
          ].join('\n\n'),
          references: [],
          code: null,
          jira: story === null ? null : { key: story.key },
          confluence: page === null ? null : { pageId: page.id },
        });
        useAssistantStore.getState().close();
      },
      sendBug: ({ workspaceId, bugId, target }) => {
        const bug = useWorkspaceStore
          .getState()
          .workspaces.find(({ id }) => id === workspaceId)
          ?.bugs.find(({ id }) => id === bugId);

        return send({
          filingId: `f-${crypto.randomUUID().slice(0, 8)}`,
          workspaceId,
          bugId,
          target,
          title: bug?.title ?? '',
          onReady: () => undefined,
        });
      },
      findPage: async (query) => {
        const wanted = confluenceWantedOf(query);
        const found = await Confluence.search(wanted.title);

        if (!found.isListed) return found.failure;

        return pickPage({ wanted, pages: found.pages }) ?? 'not-found';
      },
      findStory: async (key) => {
        const found = await Jira.search(key);

        if (!found.isListed) return found.failure;

        return found.issues.find((issue) => issue.key === key) ?? 'not-found';
      },
      changeSettings: ({ theme, language, runAlert }) => {
        if (theme !== undefined) useAppStore.getState().setTheme(theme);

        if (language !== undefined) useSettingsStore.getState().selectLanguage(language);

        if (runAlert !== undefined) useSettingsStore.getState().selectRunAlert(runAlert);
      },
      connectIntegration: (id) => {
        useSettingsStore.getState().selectTab('connections');
        bringForward();
        useAppStore.getState().openSettings();
        useSetupStore.getState().askToConnect(id);
        useAssistantStore.getState().close();
      },
      disconnectIntegration: async (id) => {
        await Integrations.disconnect(id);
        useSetupStore.getState().dropIntegration(id);
      },
      listRepositories: () => Github.repositories(),
      listBranches: (repository) => Github.branches(repository),
      startBuild: (build) => startBuild(build),
      askVariables: ({ projectId, drafts }) =>
        askVariables({ projectId, drafts, waitMs: ASSISTANT_WAIT.confirmMs }),
      applyVariables,
      confirm: ({ id, action, subject, count, detail }) =>
        new Promise<ConfirmDecision>((settle) => {
          waiting.current.set(id, settle);
          useAssistantStore.getState().open();
          useAssistantStore.getState().askConfirm({
            kind: 'confirm',
            id,
            action,
            subject,
            count,
            ...(detail === undefined ? {} : { detail }),
            decision: null,
          });
          window.setTimeout(() => {
            useAssistantStore.getState().settleConfirm({ id, decision: 'expired' });
          }, ASSISTANT_WAIT.confirmMs);
        }),
    };

    const confirmedPort: IAppPort = {
      ...port,
      confirm: () => Promise.resolve('confirmed'),
    };

    useAppToolStore
      .getState()
      .lend((props) => performAppTool({ ...props, port: confirmedPort }));

    const stopListening = Assistant.onToolCall(({ id, call }) => {
      useAssistantStore.getState().keepLiveText();

      if (!isConfirmCall(call))
        useAssistantStore.getState().startTool({
          kind: 'tool',
          id,
          call,
          subject: subjectOf({ call, state: port.read() }),
          state: 'doing',
        });

      void performAppTool({ id, call, port })
        .catch((reason: unknown): IToolDone => ({
          text: `QAzinho could not do it: ${reason instanceof Error ? reason.message : String(reason)}`,
          isError: true,
        }))
        .then((done) => {
          if (!isConfirmCall(call))
            useAssistantStore
              .getState()
              .endTool({ id, isError: done.isError, buildId: done.buildId });

          Assistant.answer({ id, text: done.text, isError: done.isError });
        });
    });

    return () => {
      stopListening();
      useAppToolStore.getState().lend(null);
    };
  }, [
    t,
    runWorkspace,
    stopWorkspace,
    startBuild,
    askAgent,
    askVariables,
    applyVariables,
    send,
  ]);
};
