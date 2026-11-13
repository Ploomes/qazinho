import type { ITemplate } from '@/shared/types';

/** Os modelos do QA como a página os conhece, lidos da main por último. */
export interface ITemplateStore {
  templates: ITemplate[];
  setTemplates: (templates: ITemplate[]) => void;
  landTemplate: (template: ITemplate) => void;
  dropTemplate: (id: string) => void;
}
