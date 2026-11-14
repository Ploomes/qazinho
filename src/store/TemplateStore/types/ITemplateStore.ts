import type { IOrgTemplates, ITemplate } from '@/shared/types';

/** Os modelos do QA e os das orgs da conta, como a página os leu da main por último. */
export interface ITemplateStore {
  templates: ITemplate[];
  orgTemplates: IOrgTemplates[];
  setTemplates: (templates: ITemplate[]) => void;
  landTemplate: (template: ITemplate) => void;
  dropTemplate: (id: string) => void;
  setOrgTemplates: (list: IOrgTemplates) => void;
  keepOrgs: (slugs: string[]) => void;
}
