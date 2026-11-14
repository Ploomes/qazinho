import type { ProjectPick } from '@/modules/Home/types';
import type { ParseKeys } from 'i18next';

export const FIELD_LABEL_KEYS: Record<ProjectPick, ParseKeys> = {
  web: 'NEW_PROJECT.WEB_LABEL',
  build: 'NEW_PROJECT.BUILD_LABEL',
  code: 'NEW_PROJECT.CARD_CODE',
  tests: 'NEW_PROJECT.TESTS_LABEL',
  story: 'NEW_PROJECT.STORY_LABEL',
  design: 'NEW_PROJECT.DESIGN_LABEL',
  none: 'NEW_PROJECT.NONE',
};
