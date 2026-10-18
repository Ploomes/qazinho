import type { IQuestionAnswer, IRunMessage } from '@/modules/Chat/types';
import type { IChatReference } from '@/shared/types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatAnswers,
  insertMention,
  mentionCandidates,
  mentionQueryOf,
  mentionsIn,
  referencesOf,
} from '@/modules/Chat/library';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { planOfDraft } from '@/modules/Plan';
import { flattenPlanSteps, RUN_ENDS } from '@/modules/Run';
import { Agent } from '@/services';
import { useSelectedWorkspacePart } from '@/shared/hooks/useSelectedWorkspacePart';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');
  const { t } = useTranslation();

  const projects = useAppStore((state) => state.projects);
  const workspace = useSelectedWorkspacePart((opened) => ({
    id: opened.id,
    projectId: opened.projectId,
    targetId: opened.targetId,
    sessionId: opened.sessionId,
    chat: opened.chat,
    plan: opened.plan,
    runs: opened.runs,
    bugs: opened.bugs,
  }));
  const detected = useMachineStore((state) => state.agents);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const isAgentTyping = useWorkspaceStore((state) => state.isAgentTyping);
  const liveText = useWorkspaceStore((state) => state.liveText);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const landAgentText = useWorkspaceStore((state) => state.landAgentText);
  const landPlan = useWorkspaceStore((state) => state.landPlan);
  const landQuestions = useWorkspaceStore((state) => state.landQuestions);
  const answerQuestions = useWorkspaceStore((state) => state.answerQuestions);
  const landAgentError = useWorkspaceStore((state) => state.landAgentError);
  const answerAsk = useWorkspaceStore((state) => state.answerAsk);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const references = workspace === null ? [] : referencesOf(workspace);
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

  const askAgent = (props: { text: string; references: IChatReference[] }) => {
    if (!workspace) return;

    const workspaceId = workspace.id;

    void Agent.ask({
      workspaceId,
      agentId,
      model,
      sessionId: workspace.sessionId,
      text: props.text,
      target: target === null ? null : { kind: target.kind, value: target.value },
      steps: flattenPlanSteps(workspace.plan),
      references: props.references,
    }).then((turn) => {
      if (turn.isError) {
        landAgentError({ workspaceId, text: turn.text });

        return;
      }

      const { answer } = turn;
      const plan = answer?.plan ? planOfDraft(answer.plan.cases) : null;

      if (
        !answer ||
        (answer.reply.length === 0 && plan === null && answer.questions.length === 0)
      ) {
        landAgentError({ workspaceId, text: CHAT.unreadable });

        return;
      }

      if (plan === null)
        landAgentText({
          workspaceId,
          text: answer.reply,
          who: agentName,
          sessionId: turn.sessionId,
        });
      else
        landPlan({
          workspaceId,
          summary: answer.reply,
          plan,
          who: agentName,
          sessionId: turn.sessionId,
        });

      landQuestions({ workspaceId, questions: answer.questions });
    });
  };

  const send = (text: string) => {
    if (!workspace || text.trim().length === 0) return;

    const references = mentionsIn({ text, references: referencesOf(workspace) });

    sendMessage({
      workspaceId: workspace.id,
      text,
      mentions: references.map(({ id }) => id),
    });
    setDraft('');
    askAgent({ text, references });
  };

  const runTitleOf = (message: IRunMessage) => {
    const end = RUN_ENDS[message.endedBy];
    const tally = { id: message.runId, passed: message.passed, failed: message.failed };

    return end === null
      ? t('CHAT.RUN_CARD_TITLE', tally)
      : t('CHAT.RUN_CARD_TITLE_ENDED', { ...tally, ended: t(end.labelKey) });
  };

  const answer = (props: { messageId: string; answers: IQuestionAnswer[] }) => {
    const round = workspace?.chat.find(({ id }) => id === props.messageId);

    if (!workspace || round?.kind !== 'questions' || round.answers !== null) return;
    if (isAgentTyping) return;

    answerQuestions({ workspaceId: workspace.id, ...props });
    askAgent({
      text: formatAnswers({ questions: round.questions, answers: props.answers }),
      references: [],
    });
  };

  return {
    messages: visible.map(({ message, isNew }) => ({
      message,
      isNew: isNew && !(hasPreview && message.id === lastAgentId),
      isAnswerable:
        message.kind === 'questions' &&
        message.answers === null &&
        message.id === lastId &&
        !isAgentTyping,
      runTitle: message.kind === 'run' ? runTitleOf(message) : '',
    })),
    listRef,
    onScroll,
    isEmpty: (workspace?.chat.length ?? 0) === 0,
    isAgentTyping,
    liveText: isAgentTyping ? liveText : '',
    draft,
    suggestions: CHAT.suggestions.map(({ labelKey, textKey }) => ({
      id: labelKey,
      label: t(labelKey),
      text: t(textKey),
    })),
    mentions: mentionCandidates({ references, query: mentionQuery }),
    mentionQuery,
    hasReferences: references.length > 0,
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
    onOpenRuns: () => {
      selectTab('runs');
    },
  };
};
