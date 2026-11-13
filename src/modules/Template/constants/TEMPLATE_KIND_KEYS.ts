import type { TemplateKind } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const TEMPLATE_KIND_KEYS: Record<TemplateKind, ParseKeys> = {
  bug: 'TEMPLATES.KIND_BUG',
  plan: 'TEMPLATES.KIND_PLAN',
  doubts: 'TEMPLATES.KIND_DOUBTS',
  decisions: 'TEMPLATES.KIND_DECISIONS',
};
