import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

export const PROJECT_SECTIONS = [
  { id: 'general', labelKey: 'PROJECT.SECTION_GENERAL' },
  { id: 'code', labelKey: 'PROJECT.SECTION_CODE' },
  { id: 'variables', labelKey: 'PROJECT.SECTION_VARIABLES' },
  { id: 'templates', labelKey: 'PROJECT.SECTION_TEMPLATES' },
] as const satisfies readonly { id: ProjectSection; labelKey: string }[];
