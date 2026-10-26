import type { IProStore } from './types';
import { create } from 'zustand';
import { withShare } from './library';

export const useProStore = create<IProStore>((set) => ({
  status: null,
  shares: [],
  orgProjects: [],
  link: null,

  setStatus: (status) => set({ status }),

  setShares: (shares) => set({ shares }),

  landShare: (share) =>
    set((state) => ({ shares: withShare({ shares: state.shares, share }) })),

  setOrgProjects: (orgProjects) => set({ orgProjects }),

  setLink: (link) => set({ link }),
}));
