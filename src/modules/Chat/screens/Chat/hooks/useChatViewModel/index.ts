import type { ChatItem, IQuestionAnswer, IRunMessage } from '@/modules/Chat/types';
import type {
  IChatReference,
  ICodeAsk,
  IConfluenceAsk,
  IImportAsk,
  IJiraAsk,
  IVariableBrief,
  QaReply,
} from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat/hooks/useChatAgent';
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
} from '@/modules/Chat/library';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatCommand } from '@/modules/Chat/screens/Chat/hooks/useChatCommand';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { formatElapsed } from '@/modules/Device';
import { secretIn, useVariableActions, withoutSecret } from '@/modules/Project';
import {
  dayLabelOf,
  walkedStepsOf,
  formatCost,
  RUN_ENDS,
  runDayOf,
  useRunActions,
} from '@/modules/Run';
import { Agent, Run } from '@/services';
import { EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');
  const [isSecretSent, setSecretSent] = useState(false);
  const [expandedRuns, setExpandedRuns] = useState<string[]>([]);
  const { t, i18n } = useTranslation();
  const chatAgent = useChatAgent();

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
    liveCaseIds: opened.live?.caseIds,
    isWalking: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    walked: opened.live?.outcomes.length ?? 0,
    isExploring: opened.live?.kind === 'explore',
    question:
      opened.live !== null && !opened.live.isDone ? (opened.live.question ?? null) : null,
    elapsedSec: opened.live?.elapsedSec ?? 0,
    liveCostUsd: opened.live?.costUsd ?? null,
  }));
  const askingIds = useWorkspaceStore((state) => state.askingIds);
  const liveTexts = useWorkspaceStore((state) => state.liveTexts);
  const retries = useWorkspaceStore((state) => state.retries);
  const readSteps = useWorkspaceStore((state) => state.readSteps);
  const lookingAt = useWorkspaceStore((state) => state.lookingAt);
  const isGithubConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'github'),
  );
  const isJiraConnected = useSetupStore((state) =>
    state.integrations.some(({ id }) => id === 'jira'),
  );
  const isConfluenceOn = useSetupStore((state) =>
    state.integrations.some(({ id, confluence }) => id === 'jira' && confluence === true),
  );
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const setDesign = useWorkspaceStore((state) => state.setDesign);
  const answerQuestions = useWorkspaceStore((state) => state.answerQuestions);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const selectRun = useWorkspaceStore((state) => state.selectRun);
  const openBugId = useWorkspaceStore((state) => state.openBugId);
  const toggleBug = useWorkspaceStore((state) => state.toggleBug);
  const takeSuggestion = useWorkspaceStore((state) => state.takeSuggestion);
  const { runWorkspace } = useRunActions();
  const { askVariables } = useVariableActions();

  const isAgentTyping = workspace !== null && askingIds.includes(workspace.id);
  const liveText = workspace === null ? '' : (liveTexts[workspace.id] ?? '');
  const retry = workspace === null ? undefined : retries[workspace.id];
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const say = useAssistantStore((state) => state.say);
  const closeAssistant = useAssistantStore((state) => state.close);
  const selectSettingsTab = useSettingsStore((state) => state.selectTab);
  const openSettings = useAppStore((state) => state.openSettings);
  const openProjectSection = useAppStore((state) => state.openProjectSection);
  const chatCommand = useChatCommand({
    draft,
    repositories: project?.repositories ?? [],
    isGithubConnected,
    isJiraConnected,
    isConfluenceOn,
    onDraft: setDraft,
    onBlocked: (blocker) => {
      say(t(blocker.tipKey));
      closeAssistant();

      if (blocker.place === 'integrations') {
        selectSettingsTab('integrations');
        openSettings();
      } else if (project !== null) {
        openProjectSection({ projectId: project.id, section: 'code' });
      }
    },
  });
  const pendingImport = useAppStore((state) => state.pendingImport);
  const clearImport = useAppStore((state) => state.clearImport);
  const startImport = chatCommand.startWith;
  const openProjectId = workspace?.projectId ?? null;

  useEffect(() => {
    if (pendingImport === null || pendingImport.projectId !== openProjectId) return;

    startImport(pendingImport.source);
    clearImport();
  }, [pendingImport, openProjectId, startImport, clearImport]);

  const readStep = workspace === null ? undefined : readSteps[workspace.id];
  const sentCommand = (workspace?.chat ?? [])
    .flatMap((message) =>
      message.kind === 'user' && message.command !== undefined ? [message.command] : [],
    )
    .at(-1);
  const wholePlan = t('RUN.WHOLE_PLAN');
  const exploration = t('RUN.EXPLORATION');
  const references =
    workspace === null ? [] : referencesOf({ workspace, wholePlan, exploration });
  const mentionQuery = mentionQueryOf(draft);
  const secret = secretIn(draft);
  const question = workspace?.question ?? null;
  const { listRef, visible, onScroll } = useChatScroll({
    workspaceId: workspace?.id ?? null,
    messages: workspace?.chat ?? [],
    isAgentTyping,
    questionId: question === null ? null : `${workspace?.liveId ?? ''}/${question.id}`,
  });
  const lastAgentId =
    (workspace?.chat ?? []).filter(({ kind }) => kind === 'agent').at(-1)?.id ?? null;
  const hasPreview = !isAgentTyping && liveText !== '';
  const lastId = (workspace?.chat ?? []).at(-1)?.id ?? null;

  const askAgent = (props: {
    text: string;
    references: IChatReference[];
    code: ICodeAsk | null;
    jira: IJiraAsk | null;
    confluence: IConfluenceAsk | null;
    source: IImportAsk | null;
  }) => {
    if (workspace !== null) chatAgent.askAgent({ workspaceId: workspace.id, ...props });
  };

  const isWalking = workspace?.isWalking === true;
  const liveId = isWalking ? (workspace?.liveId ?? null) : null;

  const send = (text: string, isSecretKept = isSecretSent) => {
    if (!workspace || isWalking || isAgentTyping) return;
    if (secretIn(text) !== null && !isSecretKept) return;

    setSecretSent(false);

    const asked = chatCommand.ask(text);

    if (asked === null && (chatCommand.command !== null || text.trim().length === 0))
      return;

    const references = mentionsIn({
      text,
      references: referencesOf({ workspace, wholePlan, exploration }),
    });

    if (asked !== null && asked.design !== null)
      setDesign({ workspaceId: workspace.id, design: asked.design });

    sendMessage({
      workspaceId: workspace.id,
      text,
      mentions: references.map(({ id }) => id),
      ...(asked === null ? {} : { command: asked.command }),
    });
    setDraft('');
    chatCommand.clear();
    askAgent({
      text: asked?.text ?? text,
      references,
      code: asked?.code ?? null,
      jira: asked?.jira ?? null,
      confluence: asked?.confluence ?? null,
      source: asked?.source ?? null,
    });
  };

  const screensOf = (count: number) =>
    count === 1
      ? t('CHAT.EXPLORE_SCREENS_ONE')
      : t('CHAT.EXPLORE_SCREENS_OTHER', { count });

  const runTitleOf = (message: IRunMessage) => {
    const end = RUN_ENDS[message.endedBy];

    if (message.explored !== undefined) {
      const explored = {
        id: message.runId,
        screens: screensOf(message.explored.screens),
        bugs:
          message.explored.bugs === 1
            ? t('CHAT.EXPLORE_BUGS_ONE')
            : t('CHAT.EXPLORE_BUGS_OTHER', { count: message.explored.bugs }),
      };

      return end === null
        ? t('CHAT.EXPLORE_CARD_TITLE', explored)
        : t('CHAT.EXPLORE_CARD_TITLE_ENDED', { ...explored, ended: t(end.labelKey) });
    }

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
      jira: null,
      confluence: null,
      source: null,
    });
  };

  const readStatusOf = () => {
    if (!isAgentTyping || readStep === undefined || sentCommand === undefined) return '';

    const size = formatSize({ bytes: readStep.bytes, language: i18n.language });

    if (sentCommand.id === 'jira-plan')
      return readStep.step === 'story'
        ? t('COMMANDS.STEP_STORY', { key: sentCommand.key })
        : readStep.bytes === 0
          ? t('COMMANDS.STEP_FILES', { key: sentCommand.key })
          : t('COMMANDS.STEP_FILES_SIZE', { key: sentCommand.key, size });

    if (
      sentCommand.id === 'figma-plan' ||
      sentCommand.id === 'confluence-plan' ||
      sentCommand.id === 'import-plan'
    )
      return '';

    return readStep.step === 'commit'
      ? t('COMMANDS.STEP_COMMIT', { branch: sentCommand.branch })
      : readStep.step === 'diff'
        ? t('COMMANDS.STEP_DIFF', { base: sentCommand.base })
        : readStep.bytes === 0
          ? t('COMMANDS.STEP_DOWNLOAD', { repository: sentCommand.repository })
          : t('COMMANDS.STEP_DOWNLOAD_SIZE', {
              repository: sentCommand.repository,
              size,
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
    const stepCount = walkedStepsOf({
      plan: workspace?.plan ?? [],
      caseIds: isLive ? workspace?.liveCaseIds : undefined,
    }).length;
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
      day:
        saved !== null
          ? dayLabelOf({
              day: runDayOf(saved),
              now: new Date(),
              language: i18n.language,
              words: { today: t('COMMON.TODAY'), yesterday: t('COMMON.YESTERDAY') },
            })
          : isLive
            ? t('COMMON.TODAY')
            : '',
      title:
        item.card !== null
          ? runTitleOf(item.card)
          : isLive && workspace?.isExploring === true
            ? t(
                question !== null
                  ? 'CHAT.EXPLORE_SECTION_ASKED'
                  : workspace.isPaused
                    ? 'CHAT.EXPLORE_SECTION_PAUSED'
                    : 'CHAT.EXPLORE_SECTION_LIVE',
                { id: item.runId, screens: screensOf(workspace.walked) },
              )
            : isLive
              ? t(
                  question !== null
                    ? 'CHAT.RUN_SECTION_ASKED'
                    : workspace?.isPaused
                      ? 'CHAT.RUN_SECTION_PAUSED'
                      : 'CHAT.RUN_SECTION_LIVE',
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
    lockedText:
      question !== null
        ? t('CHAT.LOCKED_ASKED')
        : isWalking
          ? t('CHAT.LOCKED_RUNNING')
          : null,
    question:
      question === null
        ? null
        : { key: `${workspace?.liveId ?? ''}/${question.id}`, live: question },
    onAnswerQuestion: (reply: QaReply) => {
      if (workspace !== null && question !== null)
        Run.answer({ workspaceId: workspace.id, questionId: question.id, reply });
    },
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
    isEmpty: (workspace?.chat.length ?? 0) === 0 && liveId === null,
    isAgentTyping,
    liveText: isAgentTyping ? liveText : '',
    retryText:
      isAgentTyping && retry !== undefined
        ? t('CHAT.RETRYING', { attempt: retry.attempt, max: retry.maxRetries })
        : '',
    lookStatus:
      !isAgentTyping || workspace === null || lookingAt[workspace.id] === undefined
        ? ''
        : t(
            lookingAt[workspace.id] === 'android'
              ? 'CHAT.LOOKING_ANDROID'
              : 'CHAT.LOOKING_IOS',
          ),
    readStatus: readStatusOf(),
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
      {
        id: 'CHAT.SUGGESTION_EXPLORE',
        label: t('CHAT.SUGGESTION_EXPLORE', { minutes: EXPLORATION.minutes }),
        text: '',
        onClick: () => {
          if (workspace !== null) runWorkspace(workspace.id, 'explore');
        },
      },
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
      {
        id: 'CHAT.SUGGESTION_FIGMA',
        label: t('CHAT.SUGGESTION_FIGMA'),
        text: '',
        onClick: () => {
          chatCommand.start('figma-plan');
        },
      },
      {
        id: 'CHAT.SUGGESTION_IMPORT',
        label: t('CHAT.SUGGESTION_IMPORT'),
        text: '',
        onClick: () => {
          chatCommand.start('import-plan');
        },
      },
      ...(isJiraConnected
        ? [
            {
              id: 'CHAT.SUGGESTION_JIRA',
              label: t('CHAT.SUGGESTION_JIRA'),
              text: '',
              onClick: () => {
                chatCommand.start('jira-plan');
              },
            },
          ]
        : []),
      ...(isConfluenceOn
        ? [
            {
              id: 'CHAT.SUGGESTION_CONFLUENCE',
              label: t('CHAT.SUGGESTION_CONFLUENCE'),
              text: '',
              onClick: () => {
                chatCommand.start('confluence-plan');
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
    isComposerFocused: (workspace?.chat.length ?? 0) === 0 && !isWalking,
    onDraftChange: (text: string) => {
      setDraft(text);
      if (secretIn(text) === null) setSecretSent(false);
    },
    secretWarning:
      secret === null || isSecretSent
        ? ''
        : t('CHAT.SECRET_WARNING', { secret: `${secret.slice(0, 6)}…` }),
    secretRemoveLabel: t('CHAT.SECRET_REMOVE'),
    secretSendLabel: t('CHAT.SECRET_SEND'),
    onRemoveSecret: () => {
      if (secret !== null) setDraft(withoutSecret({ text: draft, secret }));
    },
    onSendSecret: () => {
      send(draft, true);
    },
    onPickMention: (id: string) => {
      setDraft(insertMention({ draft, id }));
    },
    onSend: () => {
      send(draft);
    },
    onSuggestion: send,
    onAnswerQuestions: answer,
    onOpenPlan: () => {
      selectTab('plan');
    },
    onVariables: (drafts: IVariableBrief[]) =>
      workspace === null
        ? Promise.resolve(null)
        : askVariables({ projectId: workspace.projectId, drafts }),
    onTakeSuggestion: (props: { messageId: string; only: number[] }) => {
      if (workspace !== null) takeSuggestion({ workspaceId: workspace.id, ...props });
    },
  };
};
