import type { IProStore } from './types';
import { create } from 'zustand';
import { withShare } from './library';

export const useProStore = create<IProStore>((set) => ({
  status: null,
  shares: [],
  link: null,
  merging: null,
  heldRun: null,

  setStatus: (status) => set({ status }),

  setShares: (shares) => set({ shares }),

  landShare: (share) =>
    set((state) => ({ shares: withShare({ shares: state.shares, share }) })),

  setLink: (link) => set({ link }),

  openMerge: (merging) => set({ merging }),

  holdRun: (heldRun) => set({ heldRun }),
}));
