import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT } from '@/modules/Chat/screens/Chat/constants';
import { toPlanKind } from '@/modules/Plan/library';
import { useAppStore, useWorkspaceStore } from '@/store';

export const useChatViewModel = () => {
  const [draft, setDraft] = useState('');
  const replyTimer = useRef<number | null>(null);

  const projects = useAppStore((state) => state.projects);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const isAgentTyping = useWorkspaceStore((state) => state.isAgentTyping);
  const sendMessage = useWorkspaceStore((state) => state.sendMessage);
  const replyToQa = useWorkspaceStore((state) => state.replyToQa);
  const answerAsk = useWorkspaceStore((state) => state.answerAsk);
  const selectTab = useWorkspaceStore((state) => state.selectTab);

  const workspace = workspaces.find(({ id }) => id === selectedWorkspaceId) ?? null;
  const project = projects.find(({ id }) => id === workspace?.projectId) ?? null;
  const target = project?.targets.find(({ id }) => id === workspace?.targetId) ?? null;
  const kind = toPlanKind(target?.kind ?? 'web');

  useEffect(
    () => () => {
      if (replyTimer.current !== null) window.clearTimeout(replyTimer.current);
    },
    [],
  );

  const send = useCallback(
    (text: string) => {
      if (!workspace || text.trim().length === 0) return;

      const workspaceId = workspace.id;

      sendMessage({ workspaceId, text });
      setDraft('');

      replyTimer.current = window.setTimeout(() => {
        replyToQa({ workspaceId, kind });
      }, CHAT.replyDelayMs);
    },
    [kind, replyToQa, sendMessage, workspace],
  );

  const onSend = useCallback(() => {
    send(draft);
  }, [draft, send]);

  const onAnswer = useCallback(
    (reply: string) => {
      if (workspace) answerAsk({ workspaceId: workspace.id, reply });
    },
    [answerAsk, workspace],
  );

  return {
    messages: workspace?.chat ?? [],
    isEmpty: (workspace?.chat.length ?? 0) === 0,
    isAgentTyping,
    draft,
    suggestions: CHAT.suggestions,
    targetLabel: target === null ? 'No target' : `${target.label} · ${target.value}`,
    agentLabel: 'Claude Code · Sonnet',
    onDraftChange: setDraft,
    onSend,
    onSuggestion: send,
    onAnswer,
    onOpenPlan: useCallback(() => {
      selectTab('plan');
    }, [selectTab]),
    onOpenRuns: useCallback(() => {
      selectTab('runs');
    }, [selectTab]),
  };
};
