import type { IOutsidePort } from '@/modules/Outside/types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat';
import { OUTSIDE_SAYS } from '@/modules/Outside/constants';
import { performOutsideTool } from '@/modules/Outside/library';
import { useRunActions } from '@/modules/Run';
import { PLATFORM_LABEL } from '@/modules/Workspace';
import { Outside, Run } from '@/services';
import {
  useAppStore,
  useAppToolStore,
  useSettingsStore,
  useSetupStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useOutsideCalls = () => {
  const { t } = useTranslation();
  const { beginRun, stopWorkspace } = useRunActions();
  const { askAgent } = useChatAgent();

  useEffect(() => {
    const port: IOutsidePort = {
      read: () => ({
        isLoaded: useAppStore.getState().isLoaded,
        projects: useAppStore.getState().projects,
        workspaces: useWorkspaceStore.getState().workspaces,
        askingIds: useWorkspaceStore.getState().askingIds,
        variables: useVariablesStore.getState().byProject,
        settings: {
          theme: useAppStore.getState().theme,
          language: useSettingsStore.getState().language,
          runAlert: useSettingsStore.getState().runAlert,
          agent: useSettingsStore.getState().agent,
          integrations: useSetupStore.getState().integrations,
        },
      }),
      now: () => Date.now(),
      targetLabel: (kind) => t(PLATFORM_LABEL[kind]),
      putProject: (project) => {
        useAppStore.getState().putProject(project);
      },
      addWorkspace: (workspace) => {
        useWorkspaceStore.getState().addWorkspace(workspace);
      },
      startRun: beginRun,
      stopWorkspace,
      waitForRun: ({ workspaceId, ms }) =>
        new Promise((done) => {
          const hasSettled = () => {
            const live = useWorkspaceStore
              .getState()
              .workspaces.find(({ id }) => id === workspaceId)?.live;

            return !live || live.isDone || live.question !== undefined;
          };

          if (hasSettled()) {
            done();

            return;
          }

          const finish = () => {
            clearTimeout(timer);
            stopWatching();
            done();
          };
          const timer = setTimeout(finish, ms);
          const stopWatching = useWorkspaceStore.subscribe(() => {
            if (hasSettled()) finish();
          });
        }),
      networkOf: (run) => Run.network(run),
      askChat: ({ workspaceId, text }) => {
        const store = useWorkspaceStore.getState();
        const workspace = store.workspaces.find(({ id }) => id === workspaceId);

        for (const message of workspace?.chat ?? []) {
          if (message.kind !== 'questions' || message.answers !== null) continue;

          store.answerQuestions({
            workspaceId,
            messageId: message.id,
            answers: message.questions.map(() => ({ picked: [], text: '' })),
          });
        }

        store.sendMessage({ workspaceId, text, mentions: [], from: 'agent' });
        askAgent({
          workspaceId,
          text,
          references: [],
          code: null,
          jira: null,
          confluence: null,
          isFromAgent: true,
        });
      },
      waitForChat: ({ workspaceId, ms }) =>
        new Promise((done) => {
          const isAnswered = () =>
            !useWorkspaceStore.getState().askingIds.includes(workspaceId);

          if (isAnswered()) {
            done();

            return;
          }

          const finish = () => {
            clearTimeout(timer);
            stopWatching();
            done();
          };
          const timer = setTimeout(finish, ms);
          const stopWatching = useWorkspaceStore.subscribe(() => {
            if (isAnswered()) finish();
          });
        }),
      perform: (call) => {
        const { perform } = useAppToolStore.getState();

        return perform === null
          ? Promise.resolve({ text: OUTSIDE_SAYS.opening, isError: true })
          : perform({ id: `outside-${crypto.randomUUID()}`, call });
      },
      changePlan: (change) => {
        useWorkspaceStore.getState().changePlan(change);
      },
      suggestCases: (suggestion) => {
        useWorkspaceStore.getState().suggestCases(suggestion);
      },
    };

    return Outside.onCall(({ id, call }) => {
      void performOutsideTool({ call, port })
        .catch((reason: unknown) => ({
          text: `QAzinho could not do it: ${reason instanceof Error ? reason.message : String(reason)}`,
          isError: true,
        }))
        .then(({ text, isError }) => {
          Outside.answer({ id, text, isError });
        });
    });
  }, [askAgent, beginRun, stopWorkspace, t]);
};
