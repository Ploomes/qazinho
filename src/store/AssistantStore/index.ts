import type { IAssistantStore } from './types';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE } from '@/shared/constants';
import { keepSaid, keptOf, stopOpen } from './library';

export const useAssistantStore = create<IAssistantStore>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      sessionId: null,
      sessionAgentId: null,
      isAsking: false,
      liveText: '',
      unread: 0,

      open: () => set({ isOpen: true, unread: 0 }),

      close: () => set({ isOpen: false }),

      toggle: () =>
        set((state) => (state.isOpen ? { isOpen: false } : { isOpen: true, unread: 0 })),

      send: (text) =>
        set((state) => ({
          messages: [...state.messages, { kind: 'user', id: crypto.randomUUID(), text }],
          isAsking: true,
          liveText: '',
        })),

      landAnswer: ({ text, sessionId, agentId }) =>
        set((state) => ({
          messages: keepSaid({
            messages: state.messages,
            said: text,
            id: crypto.randomUUID(),
          }),
          isAsking: false,
          liveText: '',
          sessionId,
          sessionAgentId: agentId,
          unread: state.isOpen ? 0 : state.unread + 1,
        })),

      landError: (text) =>
        set((state) => ({
          messages: [
            ...stopOpen(state.messages),
            { kind: 'error', id: crypto.randomUUID(), text },
          ],
          isAsking: false,
          liveText: '',
          unread: state.isOpen ? 0 : state.unread + 1,
        })),

      landStopped: (text) =>
        set((state) => ({
          messages: [
            ...stopOpen(state.messages),
            { kind: 'note', id: crypto.randomUUID(), text },
          ],
          isAsking: false,
          liveText: '',
        })),

      setLiveText: (liveText) => set({ liveText }),

      keepLiveText: () =>
        set((state) => ({
          messages: keepSaid({
            messages: state.messages,
            said: state.liveText,
            id: crypto.randomUUID(),
          }),
          liveText: '',
        })),

      startTool: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      endTool: ({ id, isError, buildId }) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.kind === 'tool' && message.id === id
              ? {
                  ...message,
                  state: isError ? 'failed' : 'done',
                  ...(buildId === undefined ? {} : { buildId }),
                }
              : message,
          ),
        })),

      askConfirm: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      settleConfirm: ({ id, decision }) =>
        set((state) => ({
          messages: state.messages.map((message) =>
            message.kind === 'confirm' && message.id === id && message.decision === null
              ? { ...message, decision }
              : message,
          ),
        })),

      startOver: () =>
        set((state) =>
          state.isAsking
            ? {}
            : { messages: [], sessionId: null, sessionAgentId: null, liveText: '' },
        ),
    }),
    { name: STORAGE.assistant, partialize: (state) => keptOf(state) },
  ),
);
