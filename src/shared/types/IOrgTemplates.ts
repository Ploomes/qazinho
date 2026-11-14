import type { IOrgTemplate } from './IOrgTemplate';

/** Os modelos de uma org, e se o QA pode publicar um lá ou escolher o padrão. */
export interface IOrgTemplates {
  orgSlug: string;
  templates: IOrgTemplate[];
  canPublish: boolean;
  canSetDefault: boolean;
}
