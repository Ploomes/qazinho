import type { ITooltipStore } from './types';
import { create } from 'zustand';
import { TIP_TIMING } from './constants';

export const useTooltipStore = create<ITooltipStore>((set, get) => ({
  tip: null,
  session: 0,
  closedAt: 0,
  lingerTimer: null,
  show: (tip) => {
    const { tip: shown, session, lingerTimer } = get();

    if (lingerTimer !== null) clearTimeout(lingerTimer);

    const glides =
      shown !== null &&
      shown.group !== null &&
      shown.group === tip.group &&
      shown.side === tip.side;

    set({ tip, session: glides ? session : session + 1, lingerTimer: null });
  },
  update: ({ id, content }) => {
    const { tip } = get();

    if (tip?.id === id && tip.content !== content) set({ tip: { ...tip, content } });
  },
  hide: ({ id, isGroupHovered }) => {
    const { tip, lingerTimer } = get();

    if (tip?.id !== id) return;

    if (lingerTimer !== null) clearTimeout(lingerTimer);

    if (!isGroupHovered) {
      set({ tip: null, closedAt: Date.now(), lingerTimer: null });
      return;
    }

    set({
      lingerTimer: setTimeout(() => {
        if (get().tip?.id === id)
          set({ tip: null, closedAt: Date.now(), lingerTimer: null });
      }, TIP_TIMING.lingerMs),
    });
  },
  isWarm: (now) => get().tip !== null || now - get().closedAt < TIP_TIMING.warmMs,
}));
