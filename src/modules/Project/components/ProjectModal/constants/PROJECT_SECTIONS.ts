import type { ProjectSection } from '@/modules/Project/components/ProjectModal/types';

export const PROJECT_SECTIONS = [
  { id: 'general', labelKey: 'PROJECT.SECTION_GENERAL' },
  { id: 'code', labelKey: 'PROJECT.SECTION_CODE' },
  { id: 'variables', labelKey: 'PROJECT.SECTION_VARIABLES' },
  { id: 'automation', labelKey: 'PROJECT.SECTION_AUTOMATION' },
] as const satisfies readonly { id: ProjectSection; labelKey: string }[];
