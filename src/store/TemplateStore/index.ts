import type { ITemplateStore } from './types';
import { create } from 'zustand';

export const useTemplateStore = create<ITemplateStore>((set, get) => ({
  templates: [],
  orgTemplates: [],
  setTemplates: (templates) => {
    set({ templates });
  },
  landTemplate: (template) => {
    const kept = get().templates;

    set({
      templates: kept.some(({ id }) => id === template.id)
        ? kept.map((one) => (one.id === template.id ? template : one))
        : [...kept, template],
    });
  },
  dropTemplate: (id) => {
    set({ templates: get().templates.filter((one) => one.id !== id) });
  },
  setOrgTemplates: (list) => {
    set({
      orgTemplates: [
        ...get().orgTemplates.filter(({ orgSlug }) => orgSlug !== list.orgSlug),
        list,
      ],
    });
  },
  keepOrgs: (slugs) => {
    set({
      orgTemplates: get().orgTemplates.filter(({ orgSlug }) => slugs.includes(orgSlug)),
    });
  },
}));
