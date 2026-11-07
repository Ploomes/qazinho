import type { IAppToolStore } from './types';
import { create } from 'zustand';

export const useAppToolStore = create<IAppToolStore>((set) => ({
  perform: null,
  confirm: null,
  lend: ({ perform, confirm }) => {
    set({ perform, confirm });
  },
}));
