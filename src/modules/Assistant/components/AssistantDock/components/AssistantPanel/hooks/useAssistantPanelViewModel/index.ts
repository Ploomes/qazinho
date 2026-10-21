import type { IAssistantTurn } from '@/shared/types';
import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ASSISTANT_DOCK,
  ASSISTANT_FAILURE_KEYS,
  ASSISTANT_SUGGESTIONS,
} from '@/modules/Assistant/constants';
import { appSnapshotOf, suggestionsFor, toolLabelOf } from '@/modules/Assistant/library';
import { Assistant } from '@/services';
import {
  useAppStore,
  useAssistantStore,
  useMachineStore,
  useSettingsStore,
  useSetupStore,
  useWorkspaceStore,
} from '@/store';

export const useAssistantPanelViewModel = () => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messages = useAssistantStore((state) => state.messages);
  const isAsking = useAssistantStore((state) => state.isAsking);
  const liveText = useAssistantStore((state) => state.liveText);
  const sessionId = useAssistantStore((state) => state.sessionId);
  const sessionAgentId = useAssistantStore((state) => state.sessionAgentId);
  const close = useAssistantStore((state) => state.close);
  const send = useAssistantStore((state) => state.send);
  const landAnswer = useAssistantStore((state) => state.landAnswer);
  const landError = useAssistantStore((state) => state.landError);
  const landStopped = useAssistantStore((state) => state.landStopped);
  const startOver = useAssistantStore((state) => state.startOver);
  const hasProjects = useAppStore((state) => state.projects.length > 0);
  const screen = useAppStore((state) => state.screen);
  const selectedWorkspaceId = useAppStore((state) => state.selectedWorkspaceId);
  const openRuns = useWorkspaceStore((state) =>
    screen === 'workspace'
      ? (state.workspaces.find(({ id }) => id === selectedWorkspaceId)?.runs.length ??
        null)
      : null,
  );
  const agentName = useSettingsStore((state) => state.agent);
  const model = useSettingsStore((state) => state.model);
  const agentId = useMachineStore(
    (state) => state.agents.find(({ name }) => name === agentName)?.id ?? 'claude-code',
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const list = listRef.current;

    if (list !== null) list.scrollTop = list.scrollHeight;
  }, [messages.length, liveText, isAsking]);

  const failureOf = (turn: IAssistantTurn) => {
    const { failure } = turn;

    if (failure === null || failure.reason === 'stopped')
      return turn.text.trim() === '' ? t('CHAT.FAILED_AGENT_SILENT') : turn.text;

    return t(ASSISTANT_FAILURE_KEYS[failure.reason], {
      agent: agentName,
      said: 'said' in failure ? failure.said : '',
    });
  };

  const ask = (text: string) => {
    const words = text.trim();

    if (words === '' || isAsking) return;

    const app = useAppStore.getState();
    const workspaces = useWorkspaceStore.getState();
    const settings = useSettingsStore.getState();

    send(words);
    setDraft('');

    void Assistant.ask({
      agentId,
      model,
      sessionId: sessionAgentId === agentId ? sessionId : null,
      text: words,
      app: appSnapshotOf({
        screen: app.screen,
        selectedWorkspaceId: app.selectedWorkspaceId,
        tab: workspaces.tab,
        selectedRunId: workspaces.selectedRunId,
        openBugId: workspaces.openBugId,
        language: settings.language,
        theme: app.theme,
        runAlert: settings.runAlert,
        agent: settings.agent,
        integrations: useSetupStore.getState().integrations,
        projects: app.projects,
        workspaces: workspaces.workspaces,
        askingIds: workspaces.askingIds,
      }),
    }).then((turn) => {
      if (turn.failure?.reason === 'stopped') {
        landStopped(t('ASSISTANT.STOPPED'));

        return;
      }

      const asked = useAssistantStore.getState().messages;
      const hasSaid = asked
        .slice(asked.findLastIndex(({ kind }) => kind === 'user') + 1)
        .some(({ kind }) => kind !== 'user');

      if (turn.isError || (turn.text.trim() === '' && !hasSaid)) {
        landError(failureOf(turn));

        return;
      }

      landAnswer({ text: turn.text, sessionId: turn.sessionId, agentId });
    });
  };

  const doing = messages.findLast(
    (message) => message.kind === 'tool' && message.state === 'doing',
  );
  const isWaiting = messages.some(
    (message) => message.kind === 'confirm' && message.decision === null,
  );
  const last = messages.at(-1);

  return {
    listRef,
    inputRef,
    title: t('MASCOT.NAME'),
    status: isWaiting
      ? t('ASSISTANT.STATUS_WAITING')
      : isAsking
        ? doing?.kind === 'tool'
          ? t('ASSISTANT.STATUS_ACTING', {
              doing: t(toolLabelOf(doing.call).doing, { subject: doing.subject }),
            })
          : t('ASSISTANT.STATUS_THINKING')
        : last?.kind === 'error'
          ? t('ASSISTANT.STATUS_TROUBLE')
          : t('ASSISTANT.STATUS_IDLE'),
    mood: isAsking
      ? ('thinking' as const)
      : last?.kind === 'error'
        ? ('bug' as const)
        : ('neutral' as const),
    isStill: !isAsking,
    headerIntern: ASSISTANT_DOCK.headerIntern,
    emptyIntern: ASSISTANT_DOCK.emptyIntern,
    closeLabel: t('ASSISTANT.CLOSE'),
    startOverLabel: t('ASSISTANT.START_OVER'),
    canStartOver: messages.length > 0 && !isAsking,
    isEmpty: messages.length === 0 && !isAsking,
    emptyTitle: t('ASSISTANT.EMPTY_TITLE'),
    emptyBody: t('ASSISTANT.EMPTY_BODY'),
    suggestions: suggestionsFor({ hasProjects, openRuns }).map((id) => ({
      id,
      label: t(ASSISTANT_SUGGESTIONS[id]),
      onClick: () => {
        ask(t(ASSISTANT_SUGGESTIONS[id]));
      },
    })),
    rows: messages.map((message) => {
      if (message.kind === 'tool') {
        const label = toolLabelOf(message.call);

        return {
          kind: 'tool' as const,
          key: message.id,
          className: `assistant-panel__tool assistant-panel__tool--${message.state}`,
          glyph: message.state === 'done' ? '✓' : message.state === 'failed' ? '✕' : '',
          text: t(message.state === 'done' ? label.done : label.doing, {
            subject: message.subject,
          }),
          failed: message.state === 'failed' ? t('ASSISTANT.TOOL_FAILED') : '',
        };
      }

      if (message.kind === 'confirm')
        return { kind: 'confirm' as const, key: message.id, message };

      return {
        kind: message.kind,
        key: message.id,
        className: `assistant-panel__${message.kind}`,
        text: message.text,
      };
    }),
    isTyping: isAsking && !isWaiting,
    liveText,
    draft,
    placeholder: t('ASSISTANT.PLACEHOLDER'),
    sendLabel: t('ASSISTANT.SEND'),
    stopLabel: t('ASSISTANT.STOP'),
    canSend: draft.trim() !== '' && !isAsking,
    isAsking,
    onDraft: setDraft,
    onSend: () => {
      ask(draft);
    },
    onStop: () => {
      void Assistant.stop();
    },
    onStartOver: startOver,
    onClose: close,
    onInputKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing)
        return;

      event.preventDefault();
      ask(draft);
    },
    onPanelKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'Escape') return;

      event.stopPropagation();
      close();
    },
  };
};
