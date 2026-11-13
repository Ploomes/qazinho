import type { ITemplate } from './ITemplate';

/** Um modelo publicado numa org, com quem o escreveu e se é o padrão do tipo dele lá. */
export interface IOrgTemplate extends ITemplate {
  orgSlug: string;
  isDefault: boolean;
  author: string | null;
}
