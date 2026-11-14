import type { TemplateKind } from '@/shared/types';

export const TEMPLATE_VALUES: Record<TemplateKind, string[]> = {
  bug: ['title', 'case', 'app', 'story', 'run', 'step'],
  plan: ['plan', 'story', 'cases', 'date'],
  doubts: ['story', 'plan'],
  decisions: ['summary', 'story', 'meeting', 'plan'],
};
