import type { TemplateKind } from './TemplateKind';
import type { TemplatePart } from './TemplatePart';

/**
 * Um modelo do time, montado sem IA: as partes na ordem do time, o título de um bug, e se
 * os casos de um plano saem em passos ou em Gherkin.
 */
export interface ITemplate {
  id: string;
  kind: TemplateKind;
  name: string;
  title: string;
  parts: TemplatePart[];
  cases: 'steps' | 'gherkin';
  updatedAt: string;
}
