import type { TemplateKind } from '@/shared/types';
import type { ParseKeys } from 'i18next';

export const TEMPLATE_FIELDS: Record<
  TemplateKind,
  { field: string; labelKey: ParseKeys }[]
> = {
  bug: [
    { field: 'body', labelKey: 'TEMPLATES.FIELD_BODY' },
    { field: 'steps', labelKey: 'TEMPLATES.FIELD_STEPS' },
    { field: 'expected', labelKey: 'TEMPLATES.FIELD_EXPECTED' },
    { field: 'got', labelKey: 'TEMPLATES.FIELD_GOT' },
    { field: 'requests', labelKey: 'TEMPLATES.FIELD_REQUESTS' },
    { field: 'where', labelKey: 'TEMPLATES.FIELD_WHERE' },
    { field: 'attached', labelKey: 'TEMPLATES.FIELD_ATTACHED' },
    { field: 'footer', labelKey: 'TEMPLATES.FIELD_FOOTER' },
  ],
  plan: [
    { field: 'intro', labelKey: 'TEMPLATES.FIELD_INTRO' },
    { field: 'sources', labelKey: 'TEMPLATES.FIELD_SOURCES' },
    { field: 'strategy', labelKey: 'TEMPLATES.FIELD_STRATEGY' },
    { field: 'doubts', labelKey: 'TEMPLATES.FIELD_DOUBTS' },
    { field: 'cases', labelKey: 'TEMPLATES.FIELD_CASES' },
    { field: 'footer', labelKey: 'TEMPLATES.FIELD_FOOTER' },
  ],
  doubts: [{ field: 'doubts', labelKey: 'TEMPLATES.FIELD_DOUBTS' }],
  decisions: [{ field: 'decisions', labelKey: 'TEMPLATES.FIELD_DECISIONS' }],
};
