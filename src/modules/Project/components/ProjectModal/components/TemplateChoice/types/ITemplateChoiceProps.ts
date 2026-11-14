import type { TemplateKind } from '@/shared/types';

/** O modelo que um projeto usa para cada coisa que um modelo monta, e a org dele. */
export interface ITemplateChoiceProps {
  chosen: Partial<Record<TemplateKind, string>>;
  orgSlug: string | null;
  onChange: (chosen: Partial<Record<TemplateKind, string>>) => void;
}
