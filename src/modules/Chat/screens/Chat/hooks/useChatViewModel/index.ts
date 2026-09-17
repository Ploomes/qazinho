import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { useChatScroll } from '@/modules/Chat/screens/Chat/hooks/useChatScroll';
import { PLAN_SCHEMA, PROMPTS } from '@/modules/Plan/constants';
import { parseDraftedPlan } from '@/modules/Plan/library';
import { useModelInUse } from '@/modules/Settings/hooks';
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
  const { modelName } = useModelInUse();
  const { t } = useTranslation();
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
  const agentId = detected.find(({ name }) => name === agentName)?.id ?? 'claude-code';
  const { listRef, visible, onScroll } = useChatScroll({
    workspaceId: workspace?.id ?? null,
    messages: workspace?.chat ?? [],
    isAgentTyping,
  });

  const send = (text: string) => {
    if (!workspace || text.trim().length === 0) return;

    const workspaceId = workspace.id;
    const needsPlan = workspace.plan.length === 0;
    const about = { target: target?.value ?? 'an app', kind: target?.kind ?? 'web' };

    sendMessage({ workspaceId, text });
    setDraft('');

    void Agent.ask({
      workspaceId,
      agentId,
      model,
      sessionId: workspace.sessionId,
      prompt: needsPlan
        ? PROMPTS.draftPlan({ ...about, wanted: text })
        : PROMPTS.talk({ ...about, said: text }),
      schema: needsPlan ? PLAN_SCHEMA : undefined,
    }).then((turn) => {
      if (turn.isError) {
        landAgentError({ workspaceId, text: turn.text });

        return;
      }

      if (!needsPlan) {
        landAgentText({
          workspaceId,
          text: turn.text,
          who: agentName,
          sessionId: turn.sessionId,
        });

        return;
      }

      const drafted = parseDraftedPlan(turn.text);

      if (!drafted) {
        landAgentError({ workspaceId, text: CHAT.noPlanBack });

        return;
      }

      landPlan({
        workspaceId,
        summary: drafted.summary,
        plan: drafted.plan,
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
    agentLabel: t('TITLEBAR.AGENT', { agent: agentName, model: modelName }),
    onDraftChange: setDraft,
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
