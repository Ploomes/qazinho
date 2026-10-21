import type { ChatItem, IQuestionAnswer, IRunMessage } from '@/modules/Chat/types';
import type { IChatReference, ICodeAsk } from '@/shared/types';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatAnswers,
  formatSize,
  groupRunMessages,
  withLiveRun,
  insertMention,
  mentionCandidates,
  mentionQueryOf,
  mentionsIn,
  referencesOf,
  runHistoryOf,
  sessionFor,
} from '@/modules/Chat/library';
import { CHAT, CHAT_FAILURE_KEYS } from '@/modules/Chat/screens/Chat/constants';
import { useChatCommand } from '@/modules/Chat/screens/Chat/hooks/useChatCommand';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { formatElapsed, viewportOf } from '@/modules/Device';
import { caseIdsUsed, planOfDraft } from '@/modules/Plan';
import { flattenPlanSteps, formatCost, RUN_ENDS } from '@/modules/Run';
import { GITHUB_FAILURE_KEYS } from '@/modules/Setup';
import { Agent } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');
  const [expandedRuns, setExpandedRuns] = useState<string[]>([]);
  const { t, i18n } = useTranslation();

  const projects = useAppStore((state) => state.projects);
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    projectId: opened.projectId,
    targetId: opened.targetId,
    viewportId: opened.viewportId,
    sessionId: opened.sessionId,
    sessionAgentId: opened.sessionAgentId,
    chat: opened.chat,
    plan: opened.plan,
    runs: opened.runs,
    bugs: opened.bugs,
    liveId: opened.live?.id ?? null,
    liveStartedAt: opened.live?.startedAt ?? '',
    isWalking: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    walked: opened.live?.outcomes.length ?? 0,
    elapsedSec: opened.live?.elapsedSec ?? 0,
    liveCostUsd: opened.live?.costUsd ?? null,
  }));
  const detected = useMachineStore((state) => state.agents);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const askingIds = useWorkspaceStore((state) => state.askingIds);
  const liveTexts = useWorkspaceStore((state) => state.liveTexts);
  const retries = useWorkspaceStore((state) => state.retries);
  const codeSteps = useWorkspaceStore((state) => state.codeSteps);
  const isGithubConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const landAgentText = useWorkspaceStore((state) => state.landAgentText);
  const landPlan = useWorkspaceStore((state) => state.landPlan);
  const landQuestions = useWorkspaceStore((state) => state.landQuestions);
  const answerQuestions = useWorkspaceStore((state) => state.answerQuestions);
  const landAgentError = useWorkspaceStore((state) => state.landAgentError);
  const landAgentStopped = useWorkspaceStore((state) => state.landAgentStopped);
  const answerAsk = useWorkspaceStore((state) => state.answerAsk);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);

  const isAgentTyping = workspace !== null && askingIds.includes(workspace.id);
  const liveText = workspace === null ? '' : (liveTexts[workspace.id] ?? '');
  const retry = workspace === null ? undefined : retries[workspace.id];
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const chatCommand = useChatCommand({
    draft,
    repositories: project?.repositories ?? [],
    isGithubConnected,
    onDraft: setDraft,
  });
  const codeStep = workspace === null ? undefined : codeSteps[workspace.id];
  const sentCommand = (workspace?.chat ?? [])
    .flatMap((message) =>
      message.kind === 'user' && message.command !== undefined ? [message.command] : [],
    )
    .at(-1);
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const size = viewportOf(workspace?.viewportId);
  const wholePlan = t('RUN.WHOLE_PLAN');
  const references = workspace === null ? [] : referencesOf({ workspace, wholePlan });
  const mentionQuery = mentionQueryOf(draft);
  const agentId = detected.find(({ name }) => name === agentName)?.id ?? 'claude-code';
  const { listRef, visible, onScroll } = useChatScroll({
    workspaceId: workspace?.id ?? null,
    messages: workspace?.chat ?? [],
    isAgentTyping,
  });
  const lastAgentId =
    (workspace?.chat ?? []).filter(({ kind }) => kind === 'agent').at(-1)?.id ?? null;
  const hasPreview = !isAgentTyping && liveText !== '';
  const lastId = (workspace?.chat ?? []).at(-1)?.id ?? null;

  const askAgent = (props: {
    text: string;
    references: IChatReference[];
    code: ICodeAsk | null;
  }) => {
    if (!workspace) return;

    const workspaceId = workspace.id;

    void Agent.ask({
      workspaceId,
      agentId,
      model,
      sessionId: sessionFor({ workspace, agentId }),
      text: props.text,
      target: target === null ? null : { kind: target.kind, value: target.value },
      viewport:
        target?.kind === 'web' ? { width: size.width, height: size.height } : null,
      steps: flattenPlanSteps(workspace.plan),
      references: props.references,
      runs: runHistoryOf({ workspace, wholePlan }),
      code: props.code,
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
          who: agentName,
          agentId,
          sessionId: turn.sessionId,
        });

      landQuestions({ workspaceId, questions: answer.questions });
    });
  };

  const isWalking = workspace?.isWalking === true;
  const liveId = isWalking ? (workspace?.liveId ?? null) : null;

  const send = (text: string) => {
    if (!workspace || isWalking || isAgentTyping) return;

    const asked = chatCommand.ask(text);

    if (asked === null && (chatCommand.command !== null || text.trim().length === 0))
      return;

    const references = mentionsIn({
      text,
      references: referencesOf({ workspace, wholePlan }),
    });

    sendMessage({
      workspaceId: workspace.id,
      text,
      mentions: references.map(({ id }) => id),
      ...(asked === null ? {} : { command: asked.command }),
    });
    setDraft('');
    chatCommand.clear();
    askAgent({ text: asked?.text ?? text, references, code: asked?.code ?? null });
  };

  const runTitleOf = (message: IRunMessage) => {
    const end = RUN_ENDS[message.endedBy];
    const tally = {
      id: message.runId,
      passed:
        message.passed === 1
          ? t('CHAT.RUN_PASSED_ONE')
          : t('CHAT.RUN_PASSED_OTHER', { count: message.passed }),
      failed:
        message.failed === 1
          ? t('CHAT.RUN_FAILED_ONE')
          : t('CHAT.RUN_FAILED_OTHER', { count: message.failed }),
    };

    return end === null
      ? t('CHAT.RUN_CARD_TITLE', tally)
      : t('CHAT.RUN_CARD_TITLE_ENDED', { ...tally, ended: t(end.labelKey) });
  };

  const answer = (props: { messageId: string; answers: IQuestionAnswer[] }) => {
    const round = workspace?.chat.find(({ id }) => id === props.messageId);

    if (!workspace || round?.kind !== 'questions' || round.answers !== null) return;
    if (isAgentTyping || isWalking) return;

    answerQuestions({ workspaceId: workspace.id, ...props });
    askAgent({
      text: formatAnswers({ questions: round.questions, answers: props.answers }),
      references: [],
      code: null,
    });
  };

  const factsOf = (props: { seconds: number; costUsd: number | null }) =>
    props.costUsd === null
      ? formatElapsed(props.seconds)
      : t('RUN.FACTS', {
          duration: formatElapsed(props.seconds),
          cost: formatCost({ costUsd: props.costUsd, language: i18n.language }),
        });

  const sectionOf = (item: Extract<ChatItem, { kind: 'run' }>) => {
    const isLive = item.runId === workspace?.liveId && isWalking;
    const saved = workspace?.runs.find(({ id }) => id === item.runId) ?? null;
    const stepCount = flattenPlanSteps(workspace?.plan ?? []).length;
    const progress = {
      id: item.runId,
      current: Math.min((workspace?.walked ?? 0) + 1, stepCount),
      total: stepCount,
    };
    const count = item.messages.length;

    return {
      kind: 'run' as const,
      key: `run-${item.runId}`,
      runId: item.runId,
      at: item.at,
      title:
        item.card !== null
          ? runTitleOf(item.card)
          : isLive
            ? t(
                workspace?.isPaused ? 'CHAT.RUN_SECTION_PAUSED' : 'CHAT.RUN_SECTION_LIVE',
                progress,
              )
            : t('CHAT.RUN_SECTION', { id: item.runId }),
      facts: isLive
        ? factsOf({
            seconds: workspace?.elapsedSec ?? 0,
            costUsd: workspace?.liveCostUsd ?? null,
          })
        : saved === null
          ? ''
          : factsOf({ seconds: saved.durationSec, costUsd: saved.costUsd }),
      countLabel:
        count === 0
          ? ''
          : count === 1
            ? t('CHAT.RUN_MESSAGES_ONE')
            : t('CHAT.RUN_MESSAGES_OTHER', { count }),
      isLive,
      isExpanded: expandedRuns.includes(item.runId),
      isExpandable: count > 0,
      openLabel: saved === null ? null : t('CHAT.RUN_CARD_ACTION'),
      rows: item.messages.map(({ message, isNew }) => ({
        key: message.id,
        message,
        isNew,
      })),
    };
  };

  return {
    chatStyle: { '--chat-gutter': `${String(CHAT.gutterWidth)}px` } as CSSProperties,
    items: withLiveRun({
      items: groupRunMessages({
        messages: visible,
        runIds: [
          ...(workspace?.runs.map(({ id }) => id) ?? []),
          ...(liveId === null ? [] : [liveId]),
        ],
      }),
      liveId,
      at: workspace?.liveStartedAt ?? '',
    }).map((item) =>
      item.kind === 'run'
        ? sectionOf(item)
        : {
            kind: 'message' as const,
            key: item.message.id,
            message: item.message,
            isNew: item.isNew && !(hasPreview && item.message.id === lastAgentId),
            isAnswerable:
              item.message.kind === 'questions' &&
              item.message.answers === null &&
              item.message.id === lastId &&
              !isAgentTyping &&
              !isWalking,
          },
    ),
    lockedText: isWalking ? t('CHAT.LOCKED_RUNNING') : null,
    onStop: () => {
      if (workspace !== null && isAgentTyping) void Agent.stop(workspace.id);
    },
    onToggleRun: (runId: string) => {
      setExpandedRuns(
        expandedRuns.includes(runId)
          ? expandedRuns.filter((id) => id !== runId)
          : [...expandedRuns, runId],
      );
    },
    onOpenRun: (runId: string) => {
      selectRun(runId);
      selectTab('runs');
    },
    onOpenBug: (bugId: string) => {
      if (openBugId !== bugId) toggleBug(bugId);

      selectTab('bugs');
    },
    listRef,
    onScroll,
    isEmpty: (workspace?.chat.length ?? 0) === 0,
    isAgentTyping,
    liveText: isAgentTyping ? liveText : '',
    retryText:
      isAgentTyping && retry !== undefined
        ? t('CHAT.RETRYING', { attempt: retry.attempt, max: retry.maxRetries })
        : '',
    codeStatus:
      !isAgentTyping || codeStep === undefined || sentCommand === undefined
        ? ''
        : codeStep.step === 'commit'
          ? t('COMMANDS.STEP_COMMIT', { branch: sentCommand.branch })
          : codeStep.step === 'diff'
            ? t('COMMANDS.STEP_DIFF', { base: sentCommand.base })
            : codeStep.bytes === 0
              ? t('COMMANDS.STEP_DOWNLOAD', { repository: sentCommand.repository })
              : t('COMMANDS.STEP_DOWNLOAD_SIZE', {
                  repository: sentCommand.repository,
                  size: formatSize({ bytes: codeStep.bytes, language: i18n.language }),
                }),
    draft,
    suggestions: [
      ...CHAT.suggestions.map(({ labelKey, textKey }) => ({
        id: labelKey,
        label: t(labelKey),
        text: t(textKey),
        onClick: () => {
          send(t(textKey));
        },
      })),
      ...(isGithubConnected && (project?.repositories.length ?? 0) > 0
        ? [
            {
              id: 'CHAT.SUGGESTION_CODE',
              label: t('CHAT.SUGGESTION_CODE'),
              text: '',
              onClick: () => {
                chatCommand.start('code-plan');
              },
            },
          ]
        : []),
    ],
    mentions: mentionCandidates({ references, query: mentionQuery }),
    referenceIds: references.map(({ id }) => id),
    mentionQuery,
    hasReferences: references.length > 0,
    command: chatCommand.command,
    commandPicker: chatCommand.picker,
    onPickCommand: chatCommand.onPick,
    onCommandBack: chatCommand.onBack,
    onCommandCancel: chatCommand.onCancel,
    onDraftChange: setDraft,
    onPickMention: (id: string) => {
      setDraft(insertMention({ draft, id }));
    },
    onSend: () => {
      send(draft);
    },
    onSuggestion: send,
    onAnswer: (reply: string) => {
      if (workspace) answerAsk({ workspaceId: workspace.id, reply });
    },
    onAnswerQuestions: answer,
    onOpenPlan: () => {
      selectTab('plan');
    },
  };
};
