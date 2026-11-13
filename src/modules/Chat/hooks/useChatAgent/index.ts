import type {
  IChatAttachment,
  IChatReference,
  ICodeAsk,
  IConfluenceAsk,
  IImportAsk,
  IJiraAsk,
} from '@/shared/types';
import { useTranslation } from 'react-i18next';
import { runHistoryOf, sessionFor } from '@/modules/Chat/library';
import { CHAT_FAILURE_KEYS } from '@/modules/Chat/screens/Chat/constants';
import { viewportOf } from '@/modules/Device';
import { MEMORY } from '@/modules/Memory/constants';
import { memoriesFor } from '@/modules/Memory/library';
import { caseIdsUsed, planOfDraft } from '@/modules/Plan';
import { flattenPlanSteps } from '@/modules/Run';
import {
  CONFLUENCE_FAILURE_KEYS,
  GITHUB_FAILURE_KEYS,
  JIRA_FAILURE_KEYS,
} from '@/modules/Setup';
import { Agent } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useMemoryStore,
  useSettingsStore,
  useVariablesStore,
  useWorkspaceStore,
} from '@/store';

export const useChatAgent = () => {
  const { t } = useTranslation();

  const askAgent = (props: {
    workspaceId: string;
    text: string;
    references: IChatReference[];
    code: ICodeAsk | null;
    jira: IJiraAsk | null;
    confluence: IConfluenceAsk | null;
    source?: IImportAsk | null;
    isFromAgent?: boolean;
    attachments?: IChatAttachment[];
  }) => {
    const { workspaceId } = props;
    const workspace = useWorkspaceStore
      .getState()
      .workspaces.find(({ id }) => id === workspaceId);

    if (workspace === undefined) return;

    const { agent: agentName, model } = useSettingsStore.getState();
    const agentId =
      useMachineStore.getState().agents.find(({ name }) => name === agentName)?.id ??
      'claude-code';
    const target =
      useAppStore
        .getState()
        .projects.find(({ id }) => id === workspace.projectId)
        ?.targets.find(({ id }) => id === workspace.targetId) ?? null;
    const size = viewportOf(workspace.viewportId);
    const {
      landAgentText,
      landPlan,
      landQuestions,
      landAgentError,
      landAgentStopped,
      landFollowedSkills,
    } = useWorkspaceStore.getState();
    const project =
      useAppStore.getState().projects.find(({ id }) => id === workspace.projectId) ??
      null;

    void Agent.ask({
      workspaceId,
      projectId: workspace.projectId,
      agentId,
      model,
      sessionId: sessionFor({ workspace, agentId }),
      text: props.text,
      target: target === null ? null : { kind: target.kind, value: target.value },
      viewport:
        target?.kind === 'web' ? { width: size.width, height: size.height } : null,
      steps: flattenPlanSteps(workspace.plan),
      references: props.references,
      runs: runHistoryOf({
        workspace,
        wholePlan: t('RUN.WHOLE_PLAN'),
        exploration: t('RUN.EXPLORATION'),
      }),
      code: props.code,
      source: props.source ?? null,
      jira: props.jira,
      confluence: props.confluence,
      design: workspace.design,
      variables: useVariablesStore.getState().byProject[workspace.projectId] ?? [],
      memories: memoriesFor({
        memories: project?.memories,
        workspaceId,
        ...(target === null ? {} : { targetKind: target.kind }),
      }),
      ...(props.isFromAgent === true ? { isFromAgent: true } : {}),
      ...(props.attachments === undefined || props.attachments.length === 0
        ? {}
        : { attachments: props.attachments }),
    }).then((turn) => {
      if (turn.failure?.reason === 'stopped') {
        landAgentStopped(workspaceId);

        return;
      }

      if (turn.isError) {
        landAgentError({
          workspaceId,
          text:
            turn.failure === null
              ? turn.text
              : turn.failure.reason === 'code'
                ? t('CHAT.FAILED_CODE', {
                    reason: t(GITHUB_FAILURE_KEYS[turn.failure.failure]),
                  })
                : turn.failure.reason === 'jira'
                  ? t('CHAT.FAILED_JIRA', {
                      key: turn.failure.key,
                      reason: t(JIRA_FAILURE_KEYS[turn.failure.failure]),
                    })
                  : turn.failure.reason === 'confluence'
                    ? t('CHAT.FAILED_CONFLUENCE', {
                        reason: t(CONFLUENCE_FAILURE_KEYS[turn.failure.failure]),
                      })
                    : turn.failure.reason === 'import'
                      ? t('CHAT.FAILED_IMPORT')
                      : t(CHAT_FAILURE_KEYS[turn.failure.reason], {
                          ...turn.failure,
                          agent: agentName,
                        }),
        });

        return;
      }

      const { answer } = turn;
      const now = useWorkspaceStore
        .getState()
        .workspaces.find(({ id }) => id === workspaceId);
      const plan =
        answer?.plan && now !== undefined
          ? planOfDraft({
              cases: answer.plan.cases,
              plan: now.plan,
              used: caseIdsUsed(now),
            })
          : null;

      if (
        !answer ||
        (answer.reply.length === 0 && plan === null && answer.questions.length === 0)
      ) {
        landAgentError({ workspaceId, text: t('CHAT.UNREADABLE') });

        return;
      }

      const live = now?.live;
      const isWalking = live !== null && live !== undefined && !live.isDone;

      landFollowedSkills({ workspaceId, names: turn.followed });

      if (plan === null || isWalking)
        landAgentText({
          workspaceId,
          text: answer.reply,
          who: agentName,
          agentId,
          sessionId: turn.sessionId,
        });

      if (plan !== null && isWalking)
        landAgentError({ workspaceId, text: t('CHAT.PLAN_WHILE_RUNNING') });

      if (plan !== null && !isWalking)
        landPlan({
          workspaceId,
          summary: answer.reply,
          plan,
          source: turn.code,
          story: turn.story,
          page: turn.page,
          who: agentName,
          agentId,
          sessionId: turn.sessionId,
        });

      landQuestions({ workspaceId, questions: answer.questions });

      if (props.isFromAgent !== true && props.text.trim().length >= MEMORY.minChars)
        useMemoryStore.getState().enqueue({
          projectId: workspace.projectId,
          workspaceId,
          events: [{ kind: 'said', text: props.text }],
        });
    });
  };

  return { askAgent };
};
