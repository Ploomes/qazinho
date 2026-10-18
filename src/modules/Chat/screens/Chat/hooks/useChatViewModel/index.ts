import { useState } from 'react';
import {
  insertMention,
  mentionCandidates,
  mentionQueryOf,
  mentionsIn,
  referencesOf,
} from '@/modules/Chat/library';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { planOfDraft } from '@/modules/Plan';
import { flattenPlanSteps } from '@/modules/Run';
import { Agent } from '@/services';
import {
  useAppStore,
  useMachineStore,
  useSettingsStore,
  useWorkspaceStore,
} from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');

  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const detected = useMachineStore((state) => state.agents);
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAgentTyping = useWorkspaceStore((state) => state.isAgentTyping);
  const liveText = useWorkspaceStore((state) => state.liveText);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const landAgentText = useWorkspaceStore((state) => state.landAgentText);
  const landPlan = useWorkspaceStore((state) => state.landPlan);
  const landAgentError = useWorkspaceStore((state) => state.landAgentError);
  const answerAsk = useWorkspaceStore((state) => state.answerAsk);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
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

  const send = (text: string) => {
    if (!workspace || text.trim().length === 0) return;

    const workspaceId = workspace.id;
    const references = mentionsIn({ text, references: referencesOf(workspace) });

    sendMessage({ workspaceId, text, mentions: references.map(({ id }) => id) });
    setDraft('');

    void Agent.ask({
      workspaceId,
      agentId,
      model,
      sessionId: workspace.sessionId,
      text,
      target: target === null ? null : { kind: target.kind, value: target.value },
      steps: flattenPlanSteps(workspace.plan),
      references,
    }).then((turn) => {
      if (turn.isError) {
        landAgentError({ workspaceId, text: turn.text });

        return;
      }

      const { answer } = turn;
      const plan = answer?.plan ? planOfDraft(answer.plan.cases) : null;

      if (!answer || (answer.reply.length === 0 && plan === null)) {
        landAgentError({ workspaceId, text: CHAT.unreadable });

        return;
      }

      if (plan === null) {
        landAgentText({
          workspaceId,
          text: answer.reply,
          who: agentName,
          sessionId: turn.sessionId,
        });

        return;
      }

      landPlan({
        workspaceId,
        summary: answer.reply,
        plan,
        who: agentName,
        sessionId: turn.sessionId,
      });
    });
  };

  return {
    messages: visible,
    listRef,
    onScroll,
    isEmpty: (workspace?.chat.length ?? 0) === 0,
    isAgentTyping,
    liveText: isAgentTyping ? liveText : '',
    draft,
    suggestions: CHAT.suggestions,
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
    onOpenPlan: () => {
      selectTab('plan');
    },
    onOpenRuns: () => {
      selectTab('runs');
    },
  };
};
