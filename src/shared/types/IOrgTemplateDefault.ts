import type { TemplateKind } from './TemplateKind';

/** O modelo que vira o padrão de um tipo numa org, ou nenhum. */
export interface IOrgTemplateDefault {
  orgSlug: string;
  kind: TemplateKind;
  id: string | null;
}
