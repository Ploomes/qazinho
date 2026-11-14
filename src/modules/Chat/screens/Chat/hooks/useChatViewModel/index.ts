import type {
  ChatItem,
  ChatMessage,
  IQuestionAnswer,
  IRunMessage,
} from '@/modules/Chat/types';
import type { IRun } from '@/modules/Run/types';
import type {
  AttachFailure,
  AttachOutcome,
  IChatAttachment,
  IChatReference,
  ICodeAsk,
  IConfluenceAsk,
  IImportAsk,
  IJiraAsk,
  IVariableBrief,
  QaReply,
} from '@/shared/types';
import type { CSSProperties } from 'react';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatAgent } from '@/modules/Chat/hooks/useChatAgent';
import {
  activityLineOf,
  closedMarkdown,
  formatAnswers,
  formatSize,
  groupRunMessages,
  insertMention,
  isFollowUp,
  lastSaidOf,
  mentionCandidates,
  mentionQueryOf,
  mentionsIn,
  nextDoubtIdsOf,
  referencesOf,
  withLiveRun,
} from '@/modules/Chat/library';
import { ATTACH_FAILURE_KEYS, CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatCommand } from '@/modules/Chat/screens/Chat/hooks/useChatCommand';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { formatElapsed } from '@/modules/Device';
import { addCase } from '@/modules/Plan/library';
import { secretIn, useVariableActions, withoutSecret } from '@/modules/Project';
import {
  caseVerdict,
  countVerdicts,
  currentStepOf,
  dayLabelOf,
  walkedStepsOf,
  RUN_ENDS,
  RUN_HOW_KEYS,
  runDayOf,
  tallyPartsOf,
  useRunActions,
} from '@/modules/Run';
import { calledSkillsOf } from '@/modules/Skills';
import { Agent, Attachments, Run } from '@/services';
import { CHAT_ATTACHMENTS, EXPLORATION } from '@/shared/constants';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import {
  useAppStore,
  useAssistantStore,
  useSettingsStore,
  useSetupStore,
  useSkillStore,
  useWorkspaceStore,
} from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');
  const [attached, setAttached] = useState<{
    workspaceId: string;
    items: IChatAttachment[];
  }>({ workspaceId: '', items: [] });
  const [attachFailure, setAttachFailure] = useState<AttachFailure | null>(null);
  const [isAttaching, setAttaching] = useState(false);
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
    design: opened.design,
    plan: opened.plan,
    doubts: opened.doubts,
    canAskStory: opened.issue?.source === 'jira',
    runs: opened.runs,
    bugs: opened.bugs,
    liveId: opened.live?.id ?? null,
    liveStartedAt: opened.live?.startedAt ?? '',
    liveCaseIds: opened.live?.caseIds,
    liveHow: opened.live?.how,
    isWalking: opened.live !== null && !opened.live.isDone,
    isPaused: opened.live !== null && !opened.live.isRunning && !opened.live.isDone,
    walked: opened.live?.outcomes.length ?? 0,
    liveTalk:
      opened.live !== null && !opened.live.isDone ? (opened.live.talk ?? null) : null,
    isExploring: opened.live?.kind === 'explore',
    question:
      opened.live !== null && !opened.live.isDone ? (opened.live.question ?? null) : null,
    elapsedSec: opened.live?.elapsedSec ?? 0,
    liveCostUsd: opened.live?.costUsd ?? null,
  }));
  const askingIds = useWorkspaceStore((state) => state.askingIds);
  const liveTexts = useWorkspaceStore((state) => state.liveTexts);
  const activities = useWorkspaceStore((state) => state.activities);
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
  const talkToRun = useWorkspaceStore((state) => state.talkToRun);
  const startAskingUnheard = useWorkspaceStore((state) => state.startAskingUnheard);
  const setDesign = useWorkspaceStore((state) => state.setDesign);
  const answerQuestions = useWorkspaceStore((state) => state.answerQuestions);
  const setDoubts = useWorkspaceStore((state) => state.setDoubts);
  const selectTab = useWorkspaceStore((state) => state.selectTab);
  const setPlan = useWorkspaceStore((state) => state.setPlan);
  const toggleCase = useWorkspaceStore((state) => state.toggleCase);
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
  const agentName = useSettingsStore((state) => state.agent);
  const say = useAssistantStore((state) => state.say);
  const closeAssistant = useAssistantStore((state) => state.close);
  const selectSettingsTab = useSettingsStore((state) => state.selectTab);
  const openSettings = useAppStore((state) => state.openSettings);
  const openProjectSection = useAppStore((state) => state.openProjectSection);
  const skills = useSkillStore((state) => state.skills);
  const chatCommand = useChatCommand({
    draft,
    repositories: project?.repositories ?? [],
    isGithubConnected,
    isJiraConnected,
    isConfluenceOn,
    skills: calledSkillsOf({ skills, projectId: project?.id ?? null }),
    onDraft: setDraft,
    onBlocked: (blocker) => {
      say(t(blocker.tipKey));
      closeAssistant();

      if (blocker.place === 'integrations') {
        selectSettingsTab('connections');
        openSettings();
      } else if (project !== null) {
        openProjectSection({ projectId: project.id, section: 'code' });
      }
    },
  });
  const pendingImport = useAppStore((state) => state.pendingImport);
  const clearImport = useAppStore((state) => state.clearImport);
  const startImport = chatCommand.startWith;
  const openWorkspaceId = workspace?.id ?? null;

  useEffect(() => {
    if (pendingImport === null || pendingImport.workspaceId !== openWorkspaceId) return;

    startImport(pendingImport.source);
    clearImport();
  }, [pendingImport, openWorkspaceId, startImport, clearImport]);

  const pendingCommand = useAppStore((state) => state.pendingCommand);
  const clearCommand = useAppStore((state) => state.clearCommand);
  const startCommand = chatCommand.start;

  useEffect(() => {
    if (pendingCommand === null || pendingCommand.workspaceId !== openWorkspaceId) return;

    startCommand(pendingCommand.command);
    clearCommand();
  }, [pendingCommand, openWorkspaceId, startCommand, clearCommand]);

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
    questionId: question === null ? null : `${workspace?.liveId ?? ''}/${question.id}`,
  });
  const lastAgentId =
    (workspace?.chat ?? []).filter(({ kind }) => kind === 'agent').at(-1)?.id ?? null;
  const hasPreview = !isAgentTyping && liveText !== '';
  const lastMessage = lastSaidOf(workspace?.chat ?? []);
  const lastId = lastMessage?.id ?? null;
  const lastSaid = (workspace?.chat ?? []).findLast(({ kind }) => kind === 'user');

  const pending = attached.workspaceId === workspace?.id ? attached.items : [];
  const keep = (props: { workspaceId: string; outcome: AttachOutcome }) => {
    const { workspaceId, outcome } = props;

    if (!outcome.isAttached) {
      setAttachFailure(outcome.failure);

      return;
    }

    setAttachFailure(null);
    setAttached((current) => ({
      workspaceId,
      items: [
        ...(current.workspaceId === workspaceId ? current.items : []),
        ...outcome.attachments,
      ].slice(0, CHAT_ATTACHMENTS.maxCount),
    }));
  };

  const askAgent = (props: {
    text: string;
    references: IChatReference[];
    code: ICodeAsk | null;
    jira: IJiraAsk | null;
    confluence: IConfluenceAsk | null;
    source: IImportAsk | null;
    skill?: string | null;
    attachments?: IChatAttachment[];
  }) => {
    if (workspace !== null) chatAgent.askAgent({ workspaceId: workspace.id, ...props });
  };

  const isWalking = workspace?.isWalking === true;
  const hasOpenQuestions =
    lastMessage?.kind === 'questions' &&
    lastMessage.answers === null &&
    !isAgentTyping &&
    !isWalking;
  const activityLines = (
    workspace === null ? [] : (activities[workspace.id] ?? [])
  ).flatMap((activity) => {
    const line = activityLineOf({
      activity,
      hasDesign: workspace?.design !== null,
      say: (key, values) => t(key, values),
    });

    return line === null ? [] : [line];
  });
  const liveId = isWalking ? (workspace?.liveId ?? null) : null;

  const unheardTexts = useWorkspaceStore(
    (state) => state.unheardTalks[workspace?.id ?? ''] ?? null,
  );
  const askUnheard = useEffectEvent(() => {
    if (workspace === null || unheardTexts === null) return;

    startAskingUnheard(workspace.id);
    askAgent({
      text: unheardTexts.join('\n'),
      references: [],
      code: null,
      jira: null,
      confluence: null,
      source: null,
    });
  });
  const hasUnheard = unheardTexts !== null;

  useEffect(() => {
    if (hasUnheard && !isWalking && !isAgentTyping) askUnheard();
  }, [hasUnheard, isWalking, isAgentTyping, openWorkspaceId]);

  const send = (text: string, isSecretKept = isSecretSent) => {
    if (!workspace || isAgentTyping) return;
    if (secretIn(text) !== null && !isSecretKept) return;

    setSecretSent(false);

    if (isWalking) {
      if (text.trim().length === 0 || question !== null) return;

      talkToRun({ workspaceId: workspace.id, text });
      Run.talk({ workspaceId: workspace.id, text });
      setDraft('');

      return;
    }

    const asked = chatCommand.ask(text);

    if (
      asked === null &&
      (chatCommand.command !== null || (text.trim().length === 0 && pending.length === 0))
    )
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
      ...(pending.length === 0 ? {} : { attachments: pending }),
    });
    setDraft('');
    setAttached({ workspaceId: workspace.id, items: [] });
    setAttachFailure(null);
    chatCommand.clear();
    askAgent({
      text: asked?.text ?? text,
      references,
      code: asked?.code ?? null,
      jira: asked?.jira ?? null,
      confluence: asked?.confluence ?? null,
      source: asked?.source ?? null,
      skill: asked?.skill ?? null,
      attachments: pending,
    });
  };

  const screensOf = (count: number) =>
    count === 1
      ? t('CHAT.EXPLORE_SCREENS_ONE')
      : t('CHAT.EXPLORE_SCREENS_OTHER', { count });

  const runTitleOf = (props: {
    message: IRunMessage;
    saved: IRun | null;
    when: string;
  }) => {
    const { message, saved, when } = props;
    const end = RUN_ENDS[message.endedBy];

    if (message.explored !== undefined) {
      const explored = {
        when,
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

    const counts =
      saved === null
        ? null
        : countVerdicts(saved.cases.map(({ steps }) => caseVerdict(steps)));
    const passed = counts?.passed ?? message.passed;
    const failed = counts?.failed ?? message.failed;
    const told = tallyPartsOf({
      failed,
      blocked: counts?.blocked ?? 0,
      passed,
      say: (key, values) => t(key, values),
    }).join(', ');

    if (told === '') return t('CHAT.RUN_SECTION', { id: message.runId });

    return end === null
      ? t('CHAT.RUN_CARD_TITLE', { when, told })
      : t('CHAT.RUN_CARD_TITLE_ENDED', {
          when,
          told,
          ended: t(end.labelKey),
        });
  };

  const answer = (props: { messageId: string; answers: IQuestionAnswer[] }) => {
    const round = workspace?.chat.find(({ id }) => id === props.messageId);

    if (!workspace || round?.kind !== 'questions' || round.answers !== null) return;
    if (isAgentTyping || isWalking) return;

    const kept = workspace.doubts ?? [];
    const ids = nextDoubtIdsOf({
      doubts: kept,
      count: props.answers.filter(({ toStory }) => toStory === true).length,
    });
    const answers = props.answers.map((one) =>
      one.toStory === true ? { ...one, doubtId: ids.shift() } : one,
    );
    const asked = answers.flatMap(({ doubtId }, index) => {
      const question = round.questions[index]?.question;

      return doubtId === undefined || question === undefined
        ? []
        : [{ id: doubtId, question, sent: null, answer: null }];
    });

    if (asked.length > 0)
      setDoubts({ workspaceId: workspace.id, doubts: [...kept, ...asked] });

    answerQuestions({ workspaceId: workspace.id, messageId: props.messageId, answers });
    askAgent({
      text: formatAnswers({ questions: round.questions, answers }),
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

    if (sentCommand.id !== 'code-plan') return '';

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

  const sectionOf = (item: Extract<ChatItem, { kind: 'run' }>) => {
    const isLive = item.runId === workspace?.liveId && isWalking;
    const saved = workspace?.runs.find(({ id }) => id === item.runId) ?? null;
    const stepCount = walkedStepsOf({
      plan: workspace?.plan ?? [],
      caseIds: isLive ? workspace?.liveCaseIds : undefined,
    }).length;
    const progress = {
      id: item.runId,
      doing: t(
        RUN_HOW_KEYS[
          workspace?.liveTalk === 'checking' ? 'check' : (workspace?.liveHow ?? 'replay')
        ],
      ),
      current: currentStepOf({ walked: workspace?.walked ?? 0, total: stepCount }),
      total: stepCount,
    };
    const shownMessages = item.messages.filter(
      ({ message }) => message.kind !== 'finding',
    );
    const bugCount = item.messages.length - shownMessages.length;

    const day =
      saved !== null
        ? dayLabelOf({
            day: runDayOf(saved),
            now: new Date(),
            language: i18n.language,
            words: { today: t('COMMON.TODAY'), yesterday: t('COMMON.YESTERDAY') },
          })
        : isLive
          ? t('COMMON.TODAY')
          : '';
    const when =
      day === ''
        ? t('CHAT.RUN_WHEN', { at: item.at })
        : t('CHAT.RUN_WHEN_DAY', { day, at: item.at });

    return {
      kind: 'run' as const,
      key: `run-${item.runId}`,
      runId: item.runId,
      title:
        item.card !== null
          ? runTitleOf({ message: item.card, saved, when })
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
      activity:
        isLive && activityLines.length === 0 && workspace?.walked === 0
          ? [{ id: 0, text: t('CHAT.DOING_START'), isBug: false }]
          : activityLines,
      facts: isLive ? formatElapsed(workspace?.elapsedSec ?? 0) : '',
      isLive,
      isExpanded: expandedRuns.includes(item.runId),
      isExpandable: item.messages.length > 0,
      bugs:
        bugCount === 0
          ? null
          : t(bugCount === 1 ? 'CHAT.EXPLORE_BUGS_ONE' : 'CHAT.EXPLORE_BUGS_OTHER', {
              count: bugCount,
            }),
      openLabel: saved === null ? null : t('CHAT.RUN_CARD_ACTION'),
      rows: shownMessages.map(({ message, isNew }, index) => ({
        key: message.id,
        message,
        isNew,
        isFollowUp: isFollowUp({
          message,
          earlier: shownMessages.slice(0, index).map((shown) => shown.message),
        }),
      })),
    };
  };

  const chatItems = withLiveRun({
    items: groupRunMessages({
      messages: visible,
      runIds: [
        ...(workspace?.runs.map(({ id }) => id) ?? []),
        ...(liveId === null ? [] : [liveId]),
      ],
    }),
    liveId,
    at: workspace?.liveStartedAt ?? '',
  });
  const messagesBefore = (index: number): ChatMessage[] =>
    chatItems
      .slice(0, index)
      .flatMap((before) => (before.kind === 'message' ? [before.message] : []));

  return {
    chatStyle: { '--chat-bubble': `${String(CHAT.bubbleShare)}%` } as CSSProperties,
    items: chatItems.map((item, index) =>
      item.kind === 'run'
        ? sectionOf(item)
        : {
            kind: 'message' as const,
            key: item.message.id,
            message: item.message,
            isFollowUp: isFollowUp({
              message: item.message,
              earlier: messagesBefore(index),
            }),
            isNew: item.isNew && !(hasPreview && item.message.id === lastAgentId),
            isRetryable:
              item.message.kind === 'error' &&
              item.message.runId === null &&
              item.message.id === lastId &&
              lastSaid !== undefined &&
              !isAgentTyping &&
              !isWalking,
            isAnswerable:
              item.message.kind === 'questions' &&
              item.message.answers === null &&
              item.message.id === lastId &&
              !isAgentTyping &&
              !isWalking,
          },
    ),
    canAskStory: workspace?.canAskStory ?? false,
    lockedText: question !== null ? '' : null,
    composerHint: isWalking
      ? t('CHAT.TALK_PLACEHOLDER')
      : hasOpenQuestions
        ? t('CHAT.QUESTIONS_PLACEHOLDER')
        : null,
    canAttachFiles: !isWalking,
    talkStatus:
      workspace?.liveTalk === 'waiting'
        ? t('CHAT.TALK_WAITING')
        : workspace?.liveTalk === 'checking'
          ? t('CHAT.TALK_CHECKING')
          : '',
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
    onOpenBugs: () => {
      selectTab('bugs');
    },
    onRetry: () => {
      if (lastSaid?.kind === 'user') send(lastSaid.text);
    },
    onOpenBug: (bugId: string) => {
      if (openBugId !== bugId) toggleBug(bugId);

      selectTab('bugs');
    },
    listRef,
    onScroll,
    isEmpty: (workspace?.chat.length ?? 0) === 0 && liveId === null,
    isRunStage: isWalking,
    isAgentTyping,
    liveText: isAgentTyping ? closedMarkdown(liveText) : '',
    liveWho: agentName,
    activity: isAgentTyping ? activityLines.slice(-1) : [],
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
      ...(workspace !== null && workspace.plan.length === 0
        ? [
            {
              id: 'CHAT.SUGGESTION_WRITE',
              label: t('CHAT.SUGGESTION_WRITE'),
              text: '',
              onClick: () => {
                const plan = addCase({ plan: [], used: [] });

                setPlan({ workspaceId: workspace.id, plan });
                selectTab('plan');
                toggleCase(plan[0]?.id ?? '');
              },
            },
          ]
        : []),
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
    mentions: isWalking ? [] : mentionCandidates({ references, query: mentionQuery }),
    referenceIds: references.map(({ id }) => id),
    mentionQuery: isWalking ? null : mentionQuery,
    hasReferences: !isWalking && references.length > 0,
    command: isWalking ? null : chatCommand.command,
    commandPicker: isWalking ? null : chatCommand.picker,
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
    attachments: pending.map((one) => ({
      key: one.id,
      name: one.name,
      preview: one.kind === 'image' ? one.preview : null,
      removeLabel: t('CHAT.ATTACH_REMOVE', { name: one.name }),
    })),
    attachLabel: t('CHAT.ATTACH'),
    dropLabel: t('CHAT.ATTACH_DROP'),
    isAttaching,
    attachNotice:
      attachFailure === null
        ? ''
        : t(ATTACH_FAILURE_KEYS[attachFailure.reason], {
            name: 'name' in attachFailure ? attachFailure.name : '',
            count: CHAT_ATTACHMENTS.maxCount,
            size: CHAT_ATTACHMENTS.maxBytes / 1024 / 1024,
          }),
    onAttach: () => {
      if (workspace === null || isAttaching) return;

      const workspaceId = workspace.id;

      setAttaching(true);
      void Attachments.pick(workspaceId).then((outcome) => {
        keep({ workspaceId, outcome });
        setAttaching(false);
      });
    },
    onFiles: (files: File[]) => {
      if (workspace === null || isAttaching || files.length === 0) return;

      const workspaceId = workspace.id;
      const tooBig = files.find(({ size }) => size > CHAT_ATTACHMENTS.maxBytes);

      if (pending.length + files.length > CHAT_ATTACHMENTS.maxCount) {
        setAttachFailure({ reason: 'too-many' });

        return;
      }

      if (tooBig !== undefined) {
        setAttachFailure({ reason: 'too-big', name: tooBig.name });

        return;
      }

      setAttaching(true);
      void (async () => {
        for (const file of files) {
          const outcome = await Attachments.add({
            workspaceId,
            name: file.name === '' ? 'pasted.png' : file.name,
            data: new Uint8Array(await file.arrayBuffer()),
          });

          keep({ workspaceId, outcome });

          if (!outcome.isAttached) break;
        }

        setAttaching(false);
      })();
    },
    onRemoveAttachment: (id: string) => {
      setAttached((current) => ({
        ...current,
        items: current.items.filter((one) => one.id !== id),
      }));
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
