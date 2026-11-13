import type { TemplateKind } from '@/shared/types';

/** O modelo que um projeto usa para cada coisa que um modelo monta. */
export interface ITemplateChoiceProps {
  chosen: Partial<Record<TemplateKind, string>>;
  onChange: (chosen: Partial<Record<TemplateKind, string>>) => void;
}
