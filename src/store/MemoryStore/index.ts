import type { IMemoryStore } from './types';
import { create } from 'zustand';

export const useMemoryStore = create<IMemoryStore>((set, get) => ({
  waiting: [],
  isKeeping: false,

  enqueue: (request) => set((state) => ({ waiting: [...state.waiting, request] })),

  take: () => {
    const { waiting } = get();
    const [first] = waiting;

    if (first === undefined) return null;

    const same = waiting.filter(({ workspaceId }) => workspaceId === first.workspaceId);

    set({
      isKeeping: true,
      waiting: waiting.filter(({ workspaceId }) => workspaceId !== first.workspaceId),
    });

    return { ...first, events: same.flatMap(({ events }) => events) };
  },

  finish: () => set({ isKeeping: false }),
}));
