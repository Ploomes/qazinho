import type { ISkillStore } from './types';
import { create } from 'zustand';

export const useSkillStore = create<ISkillStore>((set, get) => ({
  skills: [],
  isLoaded: false,
  setSkills: (skills) => {
    set({ skills, isLoaded: true });
  },
  landSkills: (skills) => {
    const ids = new Set(skills.map(({ id }) => id));

    set({ skills: [...get().skills.filter(({ id }) => !ids.has(id)), ...skills] });
  },
  dropSkill: (id) => {
    set({ skills: get().skills.filter((skill) => skill.id !== id) });
  },
}));
