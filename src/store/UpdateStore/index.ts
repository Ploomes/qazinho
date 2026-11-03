import type { IUpdateStore } from './types';
import { create } from 'zustand';
import { NO_UPDATE } from '@/services/Updates/constants';

export const useUpdateStore = create<IUpdateStore>((set) => ({
  update: NO_UPDATE,
  setUpdate: (update) => {
    set({ update });
  },
}));
